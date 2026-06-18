import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <AuthForm mode="login" />
        </div>
    );
}
