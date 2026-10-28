# Nebius Token Factory feedback — Rowglass

## What we tried to build

Rowglass compares SQL changes against a developer-owned reference using local SQLite fixtures. We designed an adapter for NVIDIA Nemotron through Nebius Token Factory so a developer can review a proposed repair against independent execution evidence. Nebius's OpenAI-compatible examples made the API integration approachable. Our adapter's transport and failure handling have been exercised with mocked responses; we have not observed an authenticated Nebius model response. We therefore cannot assess actual model quality, latency, cost, or reliability.

## Onboarding and credit activation

In a recorded setup attempt on 16 October 2026, GitHub sign-in to Token Factory succeeded, but the following billing setup requested identity, country, card authorization, and agreement to terms. Pakistan was absent from the displayed country list. In a separate AI Cloud attempt on 19 October, the billing page showed an initial $25 card charge and a search for Pakistan returned no results. No card, billing details, or agreement were submitted.

A Builder Program welcome email received on 15 October said a separate $25 Token Factory credit email would follow. A targeted mailbox search on 28 October found the welcome message but no separate credit email. Neither the welcome email nor the advertised offer proves an active balance or API key. On 28 October, the cloud browser encountered a human-verification screen during sign-in, so the historical billing observations were not independently rechecked in that session.

The hackathon FAQ acknowledges that an eligible participant's country may be missing from billing onboarding and directs them to Nebius. An older indexed billing page described applying promo credit without a card, but the linked page is now unavailable and we could not establish whether that flow is reachable before the current billing gate.

## Changes that would improve the experience

1. **Show country and account requirements before registration.** Explain which countries can activate Token Factory and AI Cloud billing, and distinguish contest eligibility from service provisioning. Where a country is unsupported, link to the approved support route and expected next step.
2. **Make credit status visible.** Show whether a credit request is received, approved, redeemable, applied, expired, or blocked by billing setup. Identify whether a card is required for each offer and link to current redemption instructions from the blocking screen.
3. **Offer a supported path for eligible participants.** Where legally and operationally available, let support provision promotional access without asking a participant to select an incorrect country, or provide a clearly described alternative. Explain when no route is available.
4. **Keep model examples and catalog IDs aligned.** Offer a copyable model identifier and endpoint directly from the active catalog alongside a minimal first-call example. Make it easy to distinguish an unavailable model, an invalid key, an exhausted credit balance, and a regional restriction.

These changes could reduce uncertainty and time spent onboarding; we have not measured that impact. If an approved access route becomes available, we would run the actual Nemotron repair workflow and report reproducible observations about output, latency, reliability, and usage rather than infer them from mocks.

References: [hackathon FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs), [Token Factory quickstart](https://docs.tokenfactory.nebius.com/quickstart), and [official Nemotron examples](https://nebius.com/services/token-factory/nemotron).
