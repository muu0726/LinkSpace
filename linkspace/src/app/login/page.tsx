import { AuthForm } from "@/components/auth/AuthForm";
import { FloatingImagesBackground } from "@/components/ui/FloatingImagesBackground";

export default function LoginPage() {
    return (
        <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 overflow-hidden">
            <FloatingImagesBackground />
            <div className="relative z-10 w-full max-w-md">
                <AuthForm mode="login" />
            </div>
        </div>
    );
}
