# Station filters

The filter form exposes all list operations supported by the backend station
endpoint.

## Controls

- Street-name search with a maximum length of 100 characters
- Ascending or descending address sorting
- Nearest or farthest distance sorting when radius filtering is active
- Optional radius filtering at 2, 5, or 10 kilometres
- Editable latitude and longitude for a freely selected search position
- Browser geolocation as a convenience for filling the coordinates
- Reset action for returning to the complete list

Filters are applied together on form submission. Search text is trimmed before
it is sent. Location parameters are sent only when radius filtering is enabled,
which preserves the backend requirement that latitude, longitude, and radius
must always be provided as one group.

The distance options are disabled until radius filtering is enabled. If radius
filtering is switched off while a distance order is selected, sorting returns
to ascending address order so the frontend never submits an invalid request.

The coordinate inputs use native numeric ranges of -90 to 90 for latitude and
-180 to 180 for longitude. The backend remains the authoritative validator.

## Request lifecycle

`useStations` stores the last applied filters so a retry repeats the failed
request rather than silently loading a different list. Starting a new request
aborts the previous one. Resetting clears the active filter set and requests all
active stations.

## Accessibility

Every input has a visible label. Location inputs are grouped in a fieldset, the
location toggle uses switch semantics, native form validation protects numeric
ranges, and geolocation failures are announced as alerts.

## Tests

Tests cover query-string serialization, search normalization, address and
distance sorting, combined location parameters, allowed radii, reset behavior,
and the existing request states.
