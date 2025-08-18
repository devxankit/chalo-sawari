User-specific bookings: Should use /api/user/bookings (from user routes)
General booking operations: Should use /api/bookings (from booking routes)
/api/bookings route is meant for general booking operations (create, update, cancel), not for getting user-specific bookings.