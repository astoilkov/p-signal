# `p-signal`

> A simple way to cancel promises

[![Gzipped Size](https://img.shields.io/bundlephobia/minzip/p-signal)](https://bundlephobia.com/result?p=p-signal)
[![Build Status](https://img.shields.io/github/workflow/status/astoilkov/p-signal/CI)](https://github.com/astoilkov/p-signal/actions/workflows/main.yml)

## Install

```bash
npm install p-signal
```

## Usage

```ts
import { pSignal } from 'p-signal'

await pSignal(signal, doHeavyWork())
```

## API

#### `pSignal<T>(signal: AbortSignal | undefined, promise: Promise<T>): T`

Returns: `T` — the value returned by the promise or throws an error.

You can also pass `undefined` as first parameter. Useful for methods that accept an optional `signal` parameter:
```ts
function readFiles(files: string[], options: { signal?: AbortSignal }) {
    const result = []
    for (const file of files) {
        result.push(await pSignal(signal, readFile(file)))
    }
    return result
}
```

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

**Cancelable promises.** [p-cancelable](https://github.com/sindresorhus/p-cancelable) and [Bluebird](https://github.com/petkaantonov/bluebird) are possible repos that you can use to work with the concept of cancelable promises. Note that Bluebird last release was in 2019. I was using cancelable promises before getting the idea about `pSignal` and it was a nice experience.

**[CAF](https://github.com/getify/CAF).** An elegant way to solve this problem. I recommend it if your codebase is in JavaScript. For TypeScript, it isn't ideal because it can't be correctly typed and doesn't have built-in types.


