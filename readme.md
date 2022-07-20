# `p-signal`

> A simple way to cancel promises and async functions

[![Gzipped Size](https://img.shields.io/bundlephobia/minzip/p-signal)](https://bundlephobia.com/result?p=p-signal)
[![Build Status](https://img.shields.io/github/workflow/status/astoilkov/p-signal/CI)](https://github.com/astoilkov/p-signal/actions/workflows/main.yml)

## Install

```bash
npm install p-signal
```

## Why

- These days, the JavaScript API has a lot of async methods. Applications are using async functions more and more. However, there isn't a good solution for canceling promises. See [Alternatives](#alternatives) section for more details.
- I've researched this topic for years. The solution looks simple, but it's a culmination of a lot of trial and error.
- I aim for high-quality with [my open-source principles](https://astoilkov.com/my-open-source-principles).

## Usage

With a promise:
```ts
import { pSignal } from 'p-signal'

await pSignal(signal, fetch('https://example.com/todos'))
```

With an async function:
```ts
import { pSignal } from 'p-signal'

await pSignal(signal, async () => {
    await parseMarkdown(await fetchNote())
})
```

## API

#### `pSignal<T>(signal: AbortSignal | undefined, value: Promise<T> | () => Promise<T>): T`

Returns: `T` — the value returned by the promise or throws an error if the promise is rejected.

The first parameter accepts: `AbortSignal` or `undefined`. `undefined` as allowed type is useful for methods that accept an optional `signal` parameter:
```ts
function readFiles(files: string[], options: { signal?: AbortSignal }) {
    const result = []
    for (const file of files) {
        result.push(await pSignal(signal, readFile(file)))
    }
    return result
}
```

The second parameter accepts: a Promise, an asynchronous function, or a synchronous function that returns a Promise.

#### `isAbortError(value: unknown): value is DOMException`

Returns: `boolean`

Sometimes you care about errors but not about aborted actions. For example, you may want to send an error to an error tracking service but skip aborted actions (because they are expected).

```ts
import { pSignal } from 'p-signal'

try {
    await pSignal(signal, doHeavyWork())
} catch (err) {
    if (!isAbortError(err)) {
        sendToErrorTrackingService(err)
    }
}
```

The method also works for built-in abort errors. For example, when using `fetch()`:
```ts
import { isAbortError } from 'p-signal'

try {
    fetch(url, {
        signal
    })
} catch (err) {
    if (!isAbortError(signal)) {
        sendToErrorTrackingService(err)
    }
}
```

## Alternatives

For the past years I've experimented with different ways to cancel promises. Unfortunately, a perfect solution doesn't exist because the design of JavaScript asynchronicity has inherent problems. Here are two alternatives I was using before coming up with the idea of `p-signal`:

**Cancelable promises.** [p-cancelable](https://github.com/sindresorhus/p-cancelable) and [Bluebird](https://github.com/petkaantonov/bluebird) are possible repos that you can use to work with the concept of cancelable promises. Note that Bluebird last release was in 2019. I was using cancelable promises before getting the idea about `pSignal`, and it was a nice experience.

**[CAF](https://github.com/getify/CAF).** An elegant way to solve this problem. I recommend it if your codebase is in JavaScript. For TypeScript, it isn't ideal because it can't be correctly typed because it uses generators.
