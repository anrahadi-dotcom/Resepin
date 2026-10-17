# Chef Resepin offline QA tools

Run the 10,000-prompt offline stress suite from the repository root:

```sh
npm run qa:offline
```

It generates Gen Z Indonesian wording variants across ten intent families (recipes, ingredients, cooking technique, substitutions, storage/safety, TikTok and other sites, corrections and follow-ups, allergies, hazards, and constraints). It checks that the local response path returns a usable response and specifically verifies platform-scoped search queries and that a new search does not get mistaken for accepting an earlier recipe offer.

The suite does not call Cloudflare Workers AI, Gemini, web search, or any live API. It is a routing/regression stress test, not a claim that 10,000 model-generated answers were individually judged for factual accuracy. Use the app in a browser for a small number of end-to-end checks.
