# Sanity + Next.js + Vercel Starter Template

> A example of a Vercel-deployable project with a [Next.js](https://nextjs.org/) frontend and a [Sanity Studio](https://www.sanity.io) on /sanity

## 📃 Set Up

Clone this repository from your GitHub or Click [Use this template](https://github.com/View-Source-Dev/starter-next-js-sanity/generate).

### 1) Sanity

1. `npm install && npm create sanity@latest init --env`
2. During Sanity's initialization, it will prompt you with a warning. Type Y or n and hit enter.

```
? Select project to use... (Create new project)
? Select organization to attach project to... (None)
? Use the default dataset configuration? (Y)
? Would you like to add configuration files for a Sanity project in this Next.js folder? (Y)
? Do you want to use TypeScript? (n)
? Would you like an embedded Sanity Studio? (n)
? File /sanity.cli.js already exists. Do you want to overwrite it? (n)
? Select project template to use... (Clean project with no predefined schemas)
? File /sanity/schema.js already exists. Do you want to overwrite it? (n)
? File /sanity/env.js already exists. Do you want to overwrite it? (n)
? File /sanity/lib/client.js already exists. Do you want to overwrite it? (n)
? File /sanity/lib/image.js already exists. Do you want to overwrite it? (n)
? Would you like to add the project ID and dataset to your .env file? (Y)
? Package manager to use for installing dependencies? (npm)
```

3. Add CORS Origins to your newly created Sanity project by visiting manage.sanity.io and navigating to Settings → API. Then, add your Studio URLs with credentials, such as http://localhost:3000.

### 2) NextJS

1. Update or add the following variables in the `.env` file within the project folder:

```
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_PROJECT_ID=XXXXXX
NEXT_PUBLIC_SANITY_API_TOKEN=XXXXXX
NEXT_PUBLIC_REVALIDATE_TIME=60
SITE_URL=http://localhost:3000

// Required for Klaviyo forms:
KLAVIYO_API_KEY=XXXXXX

// Required for Mailchimp forms:
MAILCHIMP_API_KEY=XXXXXX-usX
MAILCHIMP_SERVER=usX

// Required for Sendgrid:
SENDGRID_API_KEY=XXXXXX
```

2. Here's where to find each value:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: You can find this after initializing Sanity, either from the `studio/sanity.json` file or from your Sanity dashboard.
- `NEXT_PUBLIC_SANITY_API_TOKEN`: Generate an API token for your Sanity project. Access your project from the Sanity Manage dashboard and navigate to "Settings" → "API" → "Add New Token" button. Make sure to give it `read + write` access!
- `KLAVIYO_API_KEY`: Create a Private API Key from your Klaviyo Account "Settings" → "API Keys"
- `MAILCHIMP_API_KEY`: Create an API key from "Account → "Extras" → API Keys"
- `MAILCHIMP_SERVER`: This is the server your account is from. It's in the URL when logged in and at the end of your API Key.
- `SENDGRID_API_KEY`: Create an API key from "Settings" → "API Keys" with "Restricted Access" only to "Mail Send".

# 🏃🏻‍♂️Getting Started

`npm run dev` in the project folder to start the front end locally.

- Your front end will be running on [http://localhost:3000](http://localhost:3000)
- Your Sanity Studio will be running on [http://localhost:3000/sanity](http://localhost:3000/sanity)

## Learn More

To learn more about Next.js, please refer to the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and APIs.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
  You can also check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

# 🚀 Deployment

### Vercel

This setup seamlessly integrates with Vercel, which I highly recommend as your preferred hosting provider. Follow the on-screen instructions to set up your new project. Be sure to **add the same `.env.local` variables to your Vercel Project.**

For further details, refer to our [Next.js deployment documentation](https://nextjs.org/docs/deployment).

### Sanity

This step is easy. From the `/sanity` folder in your project, simply run `sanity deploy`. Choose a subdomain, and your Studio will be accessible via the web. This is where you can invite clients to manage the project, add billing info, and edit content.

# 💡 Extras/Tips

- `Error: Failed to communicate with the Sanity API` - If you encounter this error, log out and log back in again. Run `sanity logout` and then `sanity login` to resolve it.
- **_How can I see the bundle size of my website?_** Run `npm run analyze` from your project folder. This will build your site and automatically display the [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) for your site's build files.
