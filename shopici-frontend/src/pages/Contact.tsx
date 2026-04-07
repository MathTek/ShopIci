const Contact = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 sm:p-10">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">Contact</h1>
        <p className="text-white/80 leading-relaxed mb-4">
          Need help with an order or account? Use the chat section for direct seller conversations or reach out by email.
        </p>
        <div className="space-y-2 text-white/70">
          <p>Email: support@shopici.app</p>
          <p>Hours: Monday to Friday, 9:00 - 18:00</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
