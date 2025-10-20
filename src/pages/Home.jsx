import { lazy, Suspense } from "react";

const ModuleList = lazy(() => import('../components/ModuleList'));

export default function Home() {
    return (
        <Suspense fallback={<div>Loading modules...</div>}>
            <ModuleList />
        </Suspense>
    );
}