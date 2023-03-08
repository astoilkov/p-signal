export default function isAbortError(value: unknown): value is Error {
    // checking for "TimeoutError" as well because of AbortSignal.timeout(time):
    // https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout

    if (typeof DOMException === 'undefined') {
        return (
            value instanceof Error && (value.name === 'AbortError' || value.name === 'TimeoutError')
        )
    }

    return (
        value instanceof DOMException &&
        (value.name === 'AbortError' || value.name === 'TimeoutError')
    )
}
