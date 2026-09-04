# Prompt-v3 conformance report

Date: 2026-09-04

## Validation summary

- `pnpm content:check` reports `OK` for all seven requested topics.
- `pnpm lint` passes (`eslint . && prettier --check .`).
- Every runnable article example was executed and its stdout matched the adjacent `text` block.
- JavaScript examples ran with Node 24.14.0. C++ examples compiled with GCC 13.3.0 in C++23 mode. Python examples ran with the available `python3`, Python 3.12.13. LangChain examples ran in a temporary environment with LangChain 1.4.0; that environment was removed afterward.
- The topic checker resolved all Further reading links listed below. No unresolved link remains.

## backend/jwt-authentication

- Title: unchanged, `JWT Authentication` / `JWT 身份认证`.
- Sections: renamed the definition and mechanics H2s to the exact skeleton names. Added one `Examples` H2, retained “Decoding is not verification” as its first H3, and moved the other three former example H2s under it as H3s. Deep-dive H2s remain unchanged.
- Lines: EN 404 → 406; ZH 404 → 406.
- Executed examples: `inspect-token.js`, `verify-token.js`, `claim-policy.js`, and `rotate-refresh-token.js`; all four outputs matched under Node 24.14.0.
- Verified links: RFC 7519, RFC 8725, RFC 6750, RFC 9700, and the Node.js 24 `crypto` documentation.
- Sidecars: upgraded the legacy generated-middleware review to 20 lines with a task, right answer, four checklist items, and five distinct issue kinds. The existing three interview items already met the required range.
- Unverified: no topic-specific gap. The examples intentionally demonstrate primitives with built-in Node modules rather than claiming to be a complete JOSE implementation.

## cpp/move-semantics

- Title: unchanged, `Move semantics` / `移动语义`.
- Sections: renamed the definition, mechanics, and pitfalls H2s to the exact skeleton names. Added one `Examples` H2 and retained all four former example H2 names as H3s beneath it. Deep-dive H2s remain unchanged.
- Lines: EN 402 → 404; ZH 402 → 404.
- Executed examples: `value_categories.cpp`, `byte_buffer.cpp`, `publish_report.cpp`, and `move_if_noexcept.cpp`; all compiled with `g++ -std=c++23` and all outputs matched.
- Verified links: the C++23 moved-from-state draft section, C++ Core Guidelines Rule of Zero guidance, and cppreference pages for `std::move`, move constructors, copy elision, and `std::move_if_noexcept`.
- Sidecars: the five-item quiz already had a conforming 25-line review, and four interview items already covered the topic.
- Unverified: no topic-specific gap.

## python/asyncio

- Title: changed from `Asynchronous concurrency with Python asyncio` / `Python asyncio 异步并发` to `asyncio` / `asyncio`. The existing descriptions retain the explanatory scope.
- Sections: English already used all exact skeleton names. Chinese definition, mechanics, and pitfalls H2s were normalized to `是什么，为什么存在`, `工作原理`, and `陷阱`; content stayed in place. Deep-dive H2s remain unchanged.
- Lines: EN 455 → 455; ZH 439 → 439.
- Executed examples: `schedule_tasks.py`, `task_group_failure.py`, `timeout_cleanup.py`, and `bounded_work.py`; all outputs matched with `python3` 3.12.13.
- Verified links: Python 3.14 documentation for tasks, synchronization, queues, and asyncio development, plus PEP 654.
- Sidecars: retained the conforming five-item quiz and added one cancellation-and-cleanup interview answer, bringing the topic to three interview items.
- Unverified: Python 3.14 itself is not installed locally, so execution used Python 3.12.13. The Python 3.14 documentation links resolved and the topic checker passed, but the examples were not rerun on a 3.14 interpreter in this worktree.

## ai/langchain

- Title: unchanged, `LangChain` / `LangChain`.
- Sections: normalized the definition and mechanics H2s in both languages to the exact skeleton names. The existing Examples, Pitfalls, AI-era, deep-dive, checkpoint, and Further reading order was retained.
- Lines: EN 401 → 401; ZH 401 → 401.
- Executed examples: `prompt_pipeline.py`, `parallel_enrichment.py`, `batch_routing.py`, and `tool_agent.py`; all outputs matched in an isolated LangChain 1.4.0 environment without credentials or network model calls.
- Verified links: LangChain overview, model interfaces, agents and `create_agent`, and the LangChain v1 migration notes.
- Sidecars: the five-item quiz already had a conforming 19-line review, and four interview items already covered the topic.
- Unverified: no provider-backed model behavior was exercised; all examples deliberately use deterministic local test doubles.

## architecture/cap-theorem

- Title: changed from `CAP Theorem: Consistency and Availability During Partitions` / `CAP 定理：分区期间的一致性与可用性` to `CAP theorem` / `CAP 定理`. The descriptions retain the partition trade-off explanation.
- Sections: normalized the definition, mechanics, and Examples H2s in both languages. Existing example H3s and all deep-dive H2s stayed under their original content boundaries.
- Lines: EN 406 → 406; ZH 406 → 406.
- Executed examples: `partition_choice.js`, `operation_policy.js`, `quorum_overlap.js`, and `gcounter_merge.js`; all outputs matched under Node 24.14.0.
- Verified links: Jepsen consistency models, Google SRE on consensus and quorums, Daniel Abadi's PACELC discussion, and Jepsen's linearizability definition.
- Sidecars: retained the conforming five-item quiz and added quorum-limit and partition-recovery interview answers, bringing the topic to three interview items.
- Unverified: no topic-specific gap. The runnable models are explanatory simulations, not implementations of a production consensus protocol.

## python/closures

- Title: unchanged, `Closures` / `闭包`.
- Sections: no section move was required; the pair already used the six exact skeleton H2s in order, with its own deep-dive H2 between the AI-era section and checkpoint.
- Lines: EN 402 → 402; ZH 402 → 402. The current worktree version was already above the 400-line minimum despite the older 282-line calibration description.
- Executed examples: `label_factory.py`, `attempt_counter.py`, `shared_quota.py`, and `loop_handlers.py`; all outputs matched with `python3` 3.12.13.
- Verified links: Python 3.14 reference pages for naming and binding, `nonlocal`, and function objects; `inspect.getclosurevars()`; the lambda-in-loops FAQ; and PEP 3104.
- Sidecars: extended the qualifying generated config-loader review from 13 to 19 lines and made its three issue kinds distinct. Added late-binding-fix and `nonlocal` interview answers, bringing the topic to three interview items.
- Unverified: Python 3.14 itself is not installed locally, so execution used Python 3.12.13. The Python 3.14 documentation links resolved and the topic checker passed, but the examples were not rerun on a 3.14 interpreter in this worktree.

## javascript/event-loop

- Title: unchanged, `The event loop` / `事件循环`.
- Sections: renamed the definition, mechanics, Examples, and Pitfalls H2s to the exact skeleton names. Retained the original prose, first example, three pitfalls, AI-era block, and Node 24 microtask deep dive; expanded the Examples section with nested-microtask, I/O-phase, and bounded-chunk programs. Added deep-dive H2s for phases, async functions, fairness, cancellation, errors, diagnostics, testing, and browser portability.
- Lines: EN 142 → 400; ZH 142 → 400.
- Executed examples: `event-loop.js`, `nested-microtasks.js`, `io-phase-order.js`, and `chunked-work.js`; all outputs matched under Node 24.14.0.
- Verified links: the Node.js event-loop guide, Node.js 24 microtask/next-tick and timers references, and MDN pages for the execution model, Promise timing, and microtasks.
- Sidecars: added `quiz: javascript/event-loop`; created a four-item quiz with predict, conceptual, spotbug, and a 25-line generated-code review using all five issue kinds. Added next-tick/microtask and CPU-bound-work interview answers, bringing the topic to three interview items.
- Unverified: browser rendering behavior was not exercised in a browser because every runnable example is explicitly Node-based; the linked MDN host-model references resolved.

## Lint-only formatting

The first global lint run found 13 already-tracked glossary proposal files that did not match the repository's current Prettier output. They were formatted mechanically to satisfy the required global `pnpm lint`; changes are limited to YAML line wrapping and trailing blank lines, with no glossary data changed. No other topic, journal file, or docs file was touched. The pre-existing untracked `scripts/content/mapping.draft.json` was not modified or included.
