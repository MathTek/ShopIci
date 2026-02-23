const  Chat = () => {

    const products = []; 

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="relative z-10 py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
                                My Chat
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                            </h1>
                            <p className="text-xl text-white/90 leading-relaxed font-light">
                                Manage your chat <span className="font-semibold text-cyan-300">messages</span>
                            </p>
                        </div>
                    </div>

                    <div className="px-4 sm:px-6 lg:px-8">
                            {products.length === 0 ? (
                    
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                            
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                            <span className="text-xs">✨</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        You have no conversations for the moment
                                    </h3>
                                    
                                    <p className="text-white/70 mb-6 leading-relaxed">
                                        Go to the store and contact some sellers to start chatting with them. <br />
                                        It's <span className="text-cyan-300 font-semibold">quick and easy</span>!
                                    </p>

                                    <div className="flex justify-center">
                                        <a href="/products" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition duration-300">
                                            Browse Products
                                        </a>

                                    </div>
                                </div>
                            </div>
                        ) : (

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg">
                                        <h2 className="text-xl font-semibold text-white mb-2">{product.name}</h2>
                                        <p className="text-white/70 mb-4">{product.description}</p>
                                        <span className="text-cyan-300 font-bold">${product.price}</span>
                                    </div>
                                ))}
                            </div>

                        )}
                    </div>
                </div>
        </div>
    </div>
        
    );
}

export default Chat;