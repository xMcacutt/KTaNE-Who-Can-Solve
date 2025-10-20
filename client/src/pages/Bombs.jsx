import { lazy, Suspense } from "react";

const BombList = lazy(() => import('../components/BombList'));

export default function Bombs() {
    return (
        <Suspense fallback={<div>Loading bombs...</div>}>
            <BombList/>
        </Suspense>
    );
}