export async function authWithBackend(initData: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ initData })
    });
    if (!res.ok) throw new Error('Auth failed');
    return res.json();
}
