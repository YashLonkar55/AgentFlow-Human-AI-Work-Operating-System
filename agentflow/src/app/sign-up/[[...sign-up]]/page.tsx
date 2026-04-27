import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="mesh-bg" />
            <div className="relative z-10">
                <SignUp />
            </div>
        </div>
    );
}