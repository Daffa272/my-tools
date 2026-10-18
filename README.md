# English Hub

The repository is configured as one Vercel project with a shared domain and a
single deployment. The root page is the application hub; each learning app is
served under its own path:

| App | Path |
| --- | --- |
| Hub | `/` |
| KBBI | `/kbbi/` |
| Listening | `/listening/` |
| Catatan | `/note/` |
| Benda | `/object/` |
| Tes Pauli | `/pauli/` |
| Vocabulary | `/vocab/` |

## Deploy to Vercel

1. Import the repository into Vercel and keep the project root set to the
   repository root (do not set it to one of the app folders).
2. Vercel reads `vercel.json` to build each service and route the shared
   deployment paths.
3. Add `GEMINI_API_KEY` to the Vercel project's environment variables if the
   Benda app should use the server-side Gemini API.
4. Deploy once. The hub and all apps are available on the same domain.

The Benda frontend and its Express API are separate Vercel services in the
same deployment. The shared `/api/*` path is routed to that API service.

## Run locally

Run `npm run dev` from the repository root to start the hub and all six apps.
The local hub is at `http://localhost:3100/`.
