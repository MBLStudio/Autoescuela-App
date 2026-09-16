-- =================================================================
-- unique_slot deja de contar las reservas canceladas
-- YA APLICADA en producción (2026-09-16) vía Supabase MCP — este
-- fichero es solo para dejar constancia en el historial del repo,
-- como el resto de migraciones de este proyecto.
--
-- Bug reportado por Auto-Escuela Bahillo: una alumna cancela una
-- clase, el hueco aparece libre en la app, pero cuando otro alumno
-- intenta reservarlo recibe "Ese hueco acaba de ser reservado por
-- otro alumno. Elige otro."
--
-- Causa: unique_slot era una restricción UNIQUE plana sobre
-- (instructor_id, practice_date, start_time), sin mirar el estado.
-- Al cancelar, la fila se queda en la tabla con status='cancelled'
-- pero sigue existiendo, así que esa combinación seguía "ocupada"
-- para la restricción aunque para el resto de la app (validateSlot
-- en src/lib/validar-reserva.ts, y toda consulta de disponibilidad)
-- una reserva cancelada ya se trataba como libre desde siempre.
--
-- El código nunca tuvo que cambiar: bastaba con que la restricción
-- de base de datos supiera lo mismo que ya sabía el resto de la app.
-- =================================================================

ALTER TABLE bookings DROP CONSTRAINT unique_slot;

CREATE UNIQUE INDEX unique_slot ON bookings (instructor_id, practice_date, start_time)
  WHERE status <> 'cancelled';
