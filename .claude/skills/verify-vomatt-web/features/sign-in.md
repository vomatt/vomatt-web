# Sign in

A visitor signs in or signs up with one email-code flow: enter an email, enter the 6-digit code, and (new accounts only) choose a display name. Signed-in users land where they were headed; protected pages send signed-out visitors to the login page.

## Sub-features

- `signin-new` creates an account from a new email and shows the profile step.
- `signin-existing` signs an existing account in without the profile step.
- `signin-redirect` returns the user to the protected page they asked for.
- `signin-bad-code` rejects a wrong code with an error.
- `signin-signout` signs out from the profile Settings tab.

## How to get to it (user POV)

- Open `/login` directly, or choose `Sign in` at the bottom of the desktop sidebar.
- Open a protected page (`/my-polls`, `/notifications`, `/account`) while signed out: redirected to `/login?redirect=<path>`.
- Choose `Vote` or `Post` on a poll while signed out: a `Log in or sign up` dialog opens with the same flow.

## Driving it with vv

Preconditions:

- Baseline state; the browser is signed out (fresh run, or after `signin-signout`).

- **Email step.** Run `vv b goto $W/login`, `vv b fill '#authEmail' verify-$RUN_ID@example.test`, `vv b click 'role=button[name="Continue with email"]'`. Heading `Check your email` appears with the address in bold.
- **Code step.** Run `vv b fill 'role=textbox[name="6-digit verification code"]' "$(vv otp verify-$RUN_ID@example.test)"`. Six digits submit automatically; heading `What should we call you?` appears with `Display name` prefilled from the email.
- **Profile step.** Run `vv b click 'role=button[name="Finish"]'`. URL becomes `$W/` and the sidebar shows `Notifications` and a profile card instead of `Sign in`.
- **One-shot.** `vv login <email>` runs the three steps above and prints the landing URL.
- **Bad code.** On the code step, fill `000000`. The text `That code is not right. Check the email and try again.` appears and the URL stays `/login`.
- **Redirect.** Signed out, run `vv b goto $W/my-polls`. URL becomes `/login?redirect=%2Fmy-polls`; after the email and code steps it lands on `/my-polls` with heading `My Polls`.
- **Sign out.** Run `vv b goto $W/account` (redirects to `/<username>`), `vv b click 'role=tab[name="Settings"]'`, `vv b click 'role=button[name="Log out"]'`. URL becomes `$W/` and the sidebar shows `Sign in` again.
- **Proof.** `vv b cookies` lists `accessToken` and `refreshToken` after sign-in and neither after sign-out (do not copy their values into evidence). `vv sql "select email, display_name from vomatt.users"` shows the new account.

## Gotchas

- The profile step only appears for a new email; an existing one goes straight to the landing page.
- 3 wrong codes lock the email for 5 minutes from this IP; switch to a new email instead of waiting.
- A resend is blocked for 180 s (`Resend code in m:ss`); request the first code only once per email.
- `/my-polls` and `/notifications` also redirect on the server to `/login` without `?redirect`; the proxy redirect normally wins, so a missing param is a regression worth reporting.
