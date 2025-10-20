import { lazy, Suspense } from "react";

const UserList = lazy(() => import('../components/UserList'));

export default function Users() {
    return (
        <Suspense fallback={<div>Loading users...</div>}>
            <UserList />
        </Suspense>
    );
}