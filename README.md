# SmartBus-AI setup guide

Your Journey. Made Smarter.

## Transport-office setup

1. Create an account and confirm your email, or use Google sign-in.
2. Before opening registration to students, visit `/setup` while signed in and claim the first administrator account. **Any signed-in account can claim it while no administrator exists.** Secure this step before sharing the app. Once an administrator exists, later administrators must be granted access by an existing administrator under **Users**.
3. Under **Routes**, add route names and ordered stops. Enter valid latitude and longitude for each stop; at least two located stops are needed for route-line detour checks and the DEMO simulator.
4. Under **Buses**, enter the actual bus numbers, capacities and routes. Mark simulated buses as DEMO.
5. Under **Schedules**, set departure times, direction and operating days.
6. Ask drivers to register. Under **Users**, grant driver access, then under **Assignments**, assign each driver to a bus.
7. Students select their default route and boarding stop under **Profile**.

## Daily operation

- Drivers open **Trip** on a device with location permission, start their assigned trip, and keep the page open while sharing GPS. Mobile browsers may pause GPS in the background or when the screen locks; this is not a native background-tracking app.
- GPS uploads are spaced at least 10 seconds apart. A position older than two minutes is treated as offline.
- Drivers record passenger counts and report delays, breakdowns or emergencies. Administrators acknowledge or resolve reports under **Incidents**.
- Students use **Home**, **Routes** and bus details to see available positions, stops and timetable information. **Alerts** contains personal notifications.
- Administrators use **Monitor** for fleet positions and **Reports** for 7-/30-day summaries.

## Estimates and DEMO data

- Arrival times are rule-based estimates, not a trained AI model or traffic-aware routing. They use the route line through located stops and measured speed, falling back to 20 km/h when speed is unavailable or at most 5 km/h.
- Detour warnings use a distance greater than 300 metres from that stop-to-stop line; a curved road can trigger a false warning.
- Crowding uses real passenger counts from the past 30 days near the current hour. At least three counts are needed. DEMO observations are excluded.
- DEMO movement is simulated, not live driver GPS. Stop the simulator before testing actual trips; do not mix simulated and real operations on the same bus.

## Before public use

- Finish first-administrator setup before sharing registration.
- Confirm Google Maps is enabled, billing is available, and the browser key allows the final website address. Restrict it to approved website addresses and the Maps JavaScript API.
- Verify email confirmation, Google sign-in and password-reset links on the final website address. Automated tests do not verify hosted sign-in settings or email delivery.
- Replace the placeholder contact `support@yourcollege.edu` with the transport office's real contact; it is not a working support address.
- Test a real driver trip on a phone: start, move, confirm the student map updates, record a passenger count, submit an incident, confirm alerts, then end the trip.
- Review the final security scan results before publishing. Passing automated checks is not a security guarantee.

## Development and tests

Built with TanStack Start, React, TypeScript and Tailwind CSS; data and accounts are managed by Lovable Cloud.

```sh
bun install
bun run dev
bunx vitest run
```

Keep secrets out of source code. Private configuration belongs in Lovable Cloud secrets, not browser-visible environment variables. Access control is enforced by database policies, not by hiding navigation items.
