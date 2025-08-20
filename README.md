# Sanity + Next.js + Vercel Starter Template

> A example of a Vercel-deployable project with a [Next.js](https://nextjs.org/) frontend and a [Sanity Studio](https://www.sanity.io) on /sanity

## ⚙️ Set Up

Clone this repository from your GitHub or Click [Use this template](https://github.com/View-Source-Dev/starter-next-js-sanity/generate).

### 1. Sanity

1. `npm install && npm create sanity@latest init --env`
2. During Sanity's initialization, it will prompt you with a warning. Type Y or n and hit enter.

```
? Select project to use... (Create new project)
? Select organization to attach project to... (None)
? Use the default dataset configuration? (Y)
? Would you like to add configuration files for a Sanity project in this Next.js folder? (Y)
? Do you want to use TypeScript? (n)
? Would you like an embedded Sanity Studio? (Y)
? What route do you want to use for the Studio? (/sanity)
? File /src/app/sanity/[[...tool]]/page.jsx already exists. Do you want to overwrite it? (N)
? File /sanity.config.js already exists. Do you want to overwrite it? (N)
? File /sanity.cli.js already exists. Do you want to overwrite it? (N)
? Select project template to use (Clean project with no predefined schemas)
? File /src/sanity/env.js already exists. Do you want to overwrite it? (N)
? File /src/sanity/lib/client.js already exists. Do you want to overwrite it? (N)
? File /src/sanity/lib/live.js already exists. Do you want to overwrite it? (y/N)
? File /src/sanity/lib/image.js already exists. Do you want to overwrite it? (N)
? File /src/sanity/schemaTypes/index.js already exists. Do you want to overwrite it? (N)
? File /src/sanity/structure.js already exists. Do you want to overwrite it? (N)
? Would you like to add the project ID and dataset to your .env file? (Y)
```

3. Add CORS Origins to your newly created Sanity project by visiting manage.sanity.io and navigating to Settings → API. Then, add your Studio URLs with credentials, such as http://localhost:3000.

### 2. NextJS (App Router)

1. Update or add the following variables in the `.env` file within the project folder:

   ```
    NEXT_PUBLIC_SANITY_PROJECT_ID="XXXXXX"
   	NEXT_PUBLIC_SANITY_DATASET="production"
   	NEXT_PUBLIC_SANITY_STUDIO_URL="http://localhost:3000/sanity"

   	SITE_URL="http://localhost:3000"
   	SANITY_STUDIO_PREVIEW_ORIGIN="http://localhost:3000"
   	SANITY_API_READ_TOKEN="XXXXXX"
   	SANITY_REVALIDATE_SECRET="XXXXXX"

   	// Required for email sending:
   	EMAIL_DISPLAY_NAME="Client Name"
   	EMAIL_SERVER_USER="xxx@clientwebsite.com"
   	EMAIL_SERVER_PASSWORD="****************"
   	EMAIL_SERVER_HOST="smtp.gmail.com"
   	EMAIL_SERVER_PORT="465"
   	VS_API_URL="https://view-source-api.vercel.app"
   ```

2. Here's where to find each value:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: You can find this after initializing Sanity, either from the `studio/sanity.json` file or from your Sanity dashboard.
- `SANITY_API_READ_TOKEN`: Generate an API token for your Sanity project. Access your project from the Sanity Manage dashboard and navigate to "Settings" → "API" → "Add New Token" button. Make sure to give it `read + write` access!

- `EMAIL_SERVER_PASSWORD`: Set up the password here: https://security.google.com/settings/security/apppasswords. If the link leads to a 404 page, you need to enable 2-Step Verification first. Once you've set up 2-Step Verification, you can then create an app password.

- `KLAVIYO_API_KEY`: Create a Private API Key from your Klaviyo Account "Settings" → "API Keys"
- `MAILCHIMP_API_KEY`: Create an API key from "Account → "Extras" → API Keys"
- `MAILCHIMP_SERVER`: This is the server your account is from. It's in the URL when logged in and at the end of your API Key.

## 🛠️ Development

`npm run dev` in the project folder to start the front end locally.

- Your front end will be running on [http://localhost:3000](http://localhost:3000)
- Your Sanity Studio will be running on [http://localhost:3000/sanity](http://localhost:3000/sanity)

## 🚀 Deployment

### Vercel

This setup seamlessly integrates with Vercel, which I highly recommend as your preferred hosting provider. Follow the on-screen instructions to set up your new project. Be sure to **add the same `.env.local` variables to your Vercel Project.**

For further details, refer to our [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## 💡 Extras/Tips

### Accessibility

- Use [`react-remove-scroll`](https://github.com/theKashey/react-remove-scroll) to disable scrolling wherever applicable
- Use [`react-modal`](https://github.com/reactjs/react-modal) for modal and pop-up alike components
- For scenario that `react-modal` is not applicable, like mega menu or contact form that needs to keep user inputs when closing, use the following custom hooks to manually set up `aria-hidden` and `tabindex`

<details>
<summary><code>useAriaFocusManager()</code></summary>

The `useAriaFocusManager` hook helps manage the focusability of elements based on their `aria-hidden` attribute, ensuring accessibility in scenarios like tab panels, modals, or other components with dynamic visibility. It adjusts the `tabindex` of focusable elements, ensuring that hidden elements are not focusable.

### 1. Import the `useAriaFocusManager` hook in components which ever needed

```js
import useAriaFocusManager from '@/hooks/useAriaFocusManager';
```

### 2. Create a Container Reference

Set up a `ref` for the container element that includes the focusable elements.
**This container will be observed for changes to the `aria-hidden` attribute.**

```js
const ariaRef = useRef(null);
```

### 3. Use useAriaFocusManager

Pass the `ariaRef`, any state dependencies, and an optional default `tabindex` (default is 1) to the hook.

```js
useAriaFocusManager(containerRef, [activeTab], 0);
```

- `containerRef` (required): The container that holds the focusable elements.
- `dependencies` (optional): Array of values (state/props) that will trigger re-evaluation of focusable elements when they change.
- `tabindex` (optional): The default `tabindex` value for focusable elements when they are not hidden. Default is `1`.
  - Adjust it if you need to control sequence of keyboard navigation, see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) for more information

### 4. Apply aria-hidden Attribute

Ensure the container dynamically applies the aria-hidden attribute to control visibility and focusability.

```jsx
<div
	ref={ariaRef}
	aria-hidden={activeTab !== index} // Dynamically set aria-hidden
>
	{/* Focusable elements go here */}
</div>
```

### FAQ

#### Q1: Can I use this hook in multiple components on the same page?

Yes, each instance of `useAriaFocusManager` is independent and works with its own `ref`, allowing it to be used in different components without conflict.

#### Q2: What happens when dependencies change?

When a dependency changes, the focusable elements within the container are re-evaluated. This ensures that dynamic updates, such as tab switching or modal visibility, adjust focusability correctly.

#### Q3: Does this hook work with dynamically added components?

Yes, you can use `useAriaFocusManager` inside the components that are dynamically rendered in other components, such as in `Accordion.js`. Alternatively, pass the relevant dependencies to `useAriaFocusManager` to ensure it re-evaluates the focusable elements when state changes occur.

</details>

<details>
<summary><code>useAriaFocusNavigation()</code></summary>

The `useAriaFocusNavigation` hook manages keyboard navigation within a container, restricting focus to the elements within the component when active. This is particularly useful for modals, sidebars, or other UI components that need focus to remain contained while open.

### 1. Import the `useAriaFocusNavigation` Hook

```js
import useAriaFocusNavigation from '@/hooks/useAriaFocusNavigation';
```

### 2. Create a Container Reference

Set up a `ref` for the container element that holds the focusable elements. This is the element the hook will target.

```js
const modalRef = useRef(null);
```

### 3. Use `useAriaFocusNavigation`

Pass the container `ref`, an `isActive` boolean to toggle focus containment, and an optional `onExit` callback (to perform any cleanup or state updates when the component closes).

```js
useAriaFocusNavigation(modalRef, isModalOpen, handleModalClose);
```

- `containerRef` (required): Reference to the container holding the focusable elements.
- `isActive` (required): A boolean that determines if focus trapping is active (usually tied to the component’s visibility).
- `onExit` (optional): Callback function triggered when the focus navigation deactivates, often used to restore state or focus.

### 4. Apply `tabindex` and `aria-hidden` as Needed

Ensure that elements within the container are set up for focus management and are optionally hidden when inactive.

```jsx
<div ref={modalRef} aria-hidden={!isModalOpen}>
	{/* Focusable elements go here */}
</div>
```

### FAQ

#### Q1: Can I use `useAriaFocusNavigation` with multiple components?

Yes, each instance operates independently using its own `ref` and `isActive` state, making it suitable for multiple components within the same page.

#### Q2: How does `useAriaFocusNavigation` handle tab key behavior?

The hook traps tab key navigation within the focusable elements inside the container, cycling back to the first element when the last one is reached and vice versa. This ensures that users cannot tab outside the modal or component while it is open.

#### Q3: What happens to focus when the component deactivates?

When `isActive` becomes `false`, the hook restores focus to the last focused element before the component was activated. The optional `onExit` callback also allows additional cleanup if needed.

</details>

## ❓ FAQ

<details>
<summary>Q: I encounter <code>Error: Failed to communicate with the Sanity API</code></summary>

If you encounter this error, log out and log back in again. Run `sanity logout` and then `sanity login` to resolve it.

</details>

<details>
<summary>Q: How can I see the bundle size of my website?</summary>

Run `npm run analyze` from your project folder. This will build your site and automatically display the [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) for your site's build files.

</details>
