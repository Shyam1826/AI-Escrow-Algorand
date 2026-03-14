import React from "react";
import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="flex flex-col items-center justify-center text-center gap-6 mt-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
          AI Escrow Platform
        </h1>
        <p className="mt-4 text-slate-400 text-sm md:text-base">
          A simple Algorand Testnet demo where AI-generated contracts lock funds in escrow until
          freelancers deliver high-quality work.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <Link to="/create-job" className="btn-primary">
          Create Job
        </Link>
        <Link to="/dashboard" className="btn-outline">
          Dashboard
        </Link>
      </div>
    </section>
  );
}

export default Home;

