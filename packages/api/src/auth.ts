export const AUTH_PROVIDERS = [
    {
        name: 'google',
        label: 'Continue with Google',
        icon: 'google', // We'll handle icon rendering in the UI components
    },
    {
        name: 'apple',
        label: 'Continue with Apple',
        icon: 'apple',
    },
] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number]['name'];
