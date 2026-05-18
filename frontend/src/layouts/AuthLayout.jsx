import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-acid font-black text-ink">IOX</div>
          <h1 className="mt-4 text-2xl font-semibold">IOX Exchange</h1>
          <p className="mt-2 text-sm text-slate-400">Build your assets</p>
        </div>
        <div className="glass rounded-lg p-5 sm:p-6">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
