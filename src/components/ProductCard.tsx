import React from 'react';
import { motion } from 'motion/react';
import { Store } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart?: (p: Product) => void;
    onViewProducer?: (id: string | number) => void;
    onClickProduct?: (p: Product) => void;
    isProducer?: boolean;
}

export const ProductCard = ({ product, onAddToCart, onViewProducer, onClickProduct, isProducer }: ProductCardProps) => (
    <motion.div
        layout
        whileHover={{ y: -5 }}
        className="sketch-card flex flex-col gap-4 group cursor-pointer"
        onClick={() => onClickProduct?.(product)}
    >
        <div className="aspect-square bg-stone-50 sketch-border overflow-hidden relative">
            <img
                src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2 bg-white border-2 border-stone-800 px-3 py-1.5 text-xs font-bold rounded-full shadow-[2px_2px_0px_0px_rgba(41,37,36,0.2)]">
                ${product.price.toFixed(2)}
            </div>
        </div>
        <div className="space-y-1 relative">
            <div className="flex justify-between items-start pr-2">
                <h3 className="font-bold text-stone-800 text-lg leading-tight group-hover:text-brand-leaf transition-colors">{product.name}</h3>
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{product.category}</span>
            {product.producer_name && !isProducer && (
                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onViewProducer) onViewProducer(product.producer_id);
                    }}
                    className="text-xs text-stone-500 font-bold hover:text-brand-leaf hover:underline cursor-pointer flex items-center gap-1 mt-1 block mb-1">
                    <Store size={12} className="inline opacity-50" /> {product.producer_name}
                </span>
            )}
            <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed opacity-0 hidden group-hover:opacity-100 group-hover:block transition-all">{product.description}</p>
        </div>
        {!isProducer && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(product);
                }}
                className="sketch-button !py-2.5 !text-sm w-full mt-auto"
            >
                Comprar / Simular
            </button>
        )}
    </motion.div>
);
