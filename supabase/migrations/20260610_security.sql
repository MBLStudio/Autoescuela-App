-- =================================================================
-- MIGRACIÓN DE SEGURIDAD — Auto-Escuela Bahillo
-- Aplicar en: Supabase Dashboard > SQL Editor
-- IMPORTANTE: aplicar DESPUÉS de desplegar el código (no antes)
-- =================================================================

-- -----------------------------------------------------------------
-- 1. Tabla para rate limiting de login
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx
  ON login_attempts (ip_address, created_at DESC);

-- -----------------------------------------------------------------
-- 2. RLS en students
--    anon → solo su propio registro (via x-student-token header)
--    authenticated → todos los registros (admin/instructor/secretary)
-- -----------------------------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_anon_read_by_token" ON students
  FOR SELECT TO anon
  USING (
    token = (current_setting('request.headers', true)::json->>'x-student-token')
  );

CREATE POLICY "students_auth_read_all" ON students
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "students_auth_update_all" ON students
  FOR UPDATE TO authenticated
  USING (true);

-- -----------------------------------------------------------------
-- 3. RLS en bookings
--    anon → solo reservas de su alumno (via x-student-token)
--    authenticated → todos (para panel admin/instructor)
-- -----------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Anon: leer propias reservas
CREATE POLICY "bookings_anon_select" ON bookings
  FOR SELECT TO anon
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE token = (current_setting('request.headers', true)::json->>'x-student-token')
    )
  );

-- Anon: crear propia reserva
CREATE POLICY "bookings_anon_insert" ON bookings
  FOR INSERT TO anon
  WITH CHECK (
    student_id IN (
      SELECT id FROM students
      WHERE token = (current_setting('request.headers', true)::json->>'x-student-token')
    )
  );

-- Anon: cancelar propia reserva
CREATE POLICY "bookings_anon_update" ON bookings
  FOR UPDATE TO anon
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE token = (current_setting('request.headers', true)::json->>'x-student-token')
    )
  );

-- Autenticados: acceso completo (admin panel, instructor panel)
CREATE POLICY "bookings_auth_read_all" ON bookings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "bookings_auth_update_all" ON bookings
  FOR UPDATE TO authenticated
  USING (true);

-- -----------------------------------------------------------------
-- 4. instructors — añadir políticas para alumnos y autenticados
--    (ya tiene RLS activo con política para el propio instructor)
-- -----------------------------------------------------------------

-- Anon: leer solo el instructor del alumno (para la página de reservas)
CREATE POLICY "instructors_anon_read_for_students" ON instructors
  FOR SELECT TO anon
  USING (
    id IN (
      SELECT instructor_id FROM students
      WHERE token = (current_setting('request.headers', true)::json->>'x-student-token')
        AND instructor_id IS NOT NULL
    )
  );

-- Autenticados: leer todos (instructor puede leer su propio perfil, admin puede leer todos)
-- Nota: si ya existe una política auth SELECT en instructors, omitir esta línea
CREATE POLICY "instructors_auth_read_all" ON instructors
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------
-- 5. RLS en blocked_slots
-- -----------------------------------------------------------------
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Anon: leer bloques del instructor del alumno
CREATE POLICY "blocked_slots_anon_read_for_students" ON blocked_slots
  FOR SELECT TO anon
  USING (
    instructor_id IN (
      SELECT instructor_id FROM students
      WHERE token = (current_setting('request.headers', true)::json->>'x-student-token')
        AND instructor_id IS NOT NULL
    )
  );

-- Autenticados: acceso completo (admin/instructor gestionan sus bloques)
CREATE POLICY "blocked_slots_auth_all" ON blocked_slots
  FOR ALL TO authenticated
  USING (true);

-- -----------------------------------------------------------------
-- 6. Trigger: validación server-side del tiempo de reserva
--    Impide reservar con menos de 24h de antelación o en el pasado
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_booking_time()
RETURNS TRIGGER AS $$
DECLARE
  booking_dt timestamptz;
BEGIN
  booking_dt := (NEW.practice_date::text || ' ' || NEW.start_time::text)::timestamp
                AT TIME ZONE 'Europe/Madrid';

  IF booking_dt < NOW() THEN
    RAISE EXCEPTION 'No se puede reservar en el pasado';
  END IF;

  IF booking_dt < NOW() + INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'La reserva debe hacerse con al menos 24 horas de antelación';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_booking_time ON bookings;
CREATE TRIGGER check_booking_time
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_time();
