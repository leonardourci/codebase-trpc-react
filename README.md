# codebase-trpc-react

### I created this to ease creating my SaaS and to have a code pattern to follow while "vibe-coding" instead of always facing a different codebase with weird AI stuff (even tho the front-end of this has been 100% vibe-coded)

This project doesn't follow a specific architecture, this is like a Frankenstein of the stuff I really find useful/like when coding and with focus on simplicity.

### Stack

#### Back-end
- Express.js (for stripe webhook or another payment method webhook only)
- Node.js v24.13
- TypeScript v5.9
- tRPC - for ease communication between front-end and back-end
- Zod for input validations

#### Front-end 
- React 19
- Tailwind v4
- Zod

#### Deploy

- PM2
- Cloudflare Tunnel
- Nginx
- This is meant to be deployed in a VPS, the `deploy` folder has the necessary config for this but you can go to a plug-and-play host such as Vercel, Render, Railway...

### You don't need microservices.

Most projects start with monoliths but with microservices patterns for the sake of "scalability", but I disagree. I believe a monolith must start as a monolith. That's why I'm using tRPC even tho this is not going to scale to 99+ microservices in the future. But the thing is that my SaaS with 13 users won't need any microservice and if any project that started as a monolith and now needs 99+ microservices to scale properly, you definitely already have a crazy amount of money and probably the minor issue will be replacing tRPC with usual HTTP/HTTPS api or GraphQL api or whatever, you will likely have a ton of other things needing refactor and the change from tRPC to whatever is gonna be the minior thing at all

#### You can understand the code and what third party apps you need to connect/create accounts with AI. You can easily just check the `.env.example` files as well

