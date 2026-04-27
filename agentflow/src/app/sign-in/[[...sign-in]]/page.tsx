import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="mesh-bg" />
            <div className="relative z-10">
                <SignIn />
            </div>
        </div>
    );
}