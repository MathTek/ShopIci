import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Catalog = () => {
    const [products, setProducts] = useState<Array<any>>([]);
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold">Product Catalog</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-48 object-cover mb-4 rounded"
                        />
                        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                        <p className="text-gray-700 mb-4">{product.description}</p>
                        <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Catalog;