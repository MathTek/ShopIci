import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import ProductCreationForm  from "../components/ProductCreationForm";
import { attachScheduledPromosToProducts, isPromoCurrentlyActive, normalizePromoCode, toPromoRecord } from "../services/promoCodes";

interface SellerPromotion {
    id: string;
    code?: string | null;
    title?: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    product_id?: string | null;
    promo_mode: 'code' | 'scheduled';
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    created_at?: string | null;
}

type PromoTab = 'code' | 'scheduled';
type Toast = { id: number; type: 'success' | 'error'; message: string };
type MetricPoint = { label: string; value: number };

type SellerAnalytics = {
    totalViews: number;
    totalFavorites: number;
    totalSales: number;
    totalRevenue: number;
    viewsSeries: MetricPoint[];
    favoritesSeries: MetricPoint[];
    salesSeries: MetricPoint[];
};

const ANALYTICS_DAYS = 7;
const LOCAL_PRODUCT_VIEWS_KEY = 'shopici_local_product_views_v1';
const LOCAL_PRODUCT_SALES_KEY = 'shopici_local_product_sales_v1';

const buildLastDaysKeys = (days: number) => {
    const keys: string[] = [];
    for (let index = days - 1; index >= 0; index -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - index);
        keys.push(date.toISOString().slice(0, 10));
    }
    return keys;
};

const toDisplayLabel = (isoDay: string) => {
    const date = new Date(`${isoDay}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const resolveMetricDate = (row: any) => {
    return row?.created_at
        || row?.viewed_at
        || row?.inserted_at
        || row?.updated_at
        || row?.date
        || row?.viewed_on
        || row?.ordered_at
        || row?.order_date
        || row?.sold_at
        || row?.purchased_at
        || row?.transaction_date
        || row?.paid_at;
};

const createEmptyMetricSeries = (days = ANALYTICS_DAYS): MetricPoint[] => {
    return buildLastDaysKeys(days).map((key) => ({ label: toDisplayLabel(key), value: 0 }));
};

const createEmptyAnalytics = (): SellerAnalytics => ({
    totalViews: 0,
    totalFavorites: 0,
    totalSales: 0,
    totalRevenue: 0,
    viewsSeries: createEmptyMetricSeries(),
    favoritesSeries: createEmptyMetricSeries(),
    salesSeries: createEmptyMetricSeries(),
});

const MyProducts = () => {
    const [products, setProducts] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isForUpdate, setIsForUpdate] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activePromoTab, setActivePromoTab] = useState<PromoTab>('code');
    const [promoCodeForm, setPromoCodeForm] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: '',
        productId: '',
    });
    const [scheduledPromoForm, setScheduledPromoForm] = useState({
        title: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: '',
        productId: '',
        startDate: '',
        endDate: '',
    });
    const [promoError, setPromoError] = useState<string | null>(null);
    const [isCreatingPromoCode, setIsCreatingPromoCode] = useState(false);
    const [isCreatingScheduledPromo, setIsCreatingScheduledPromo] = useState(false);
    const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [analytics, setAnalytics] = useState<SellerAnalytics>(createEmptyAnalytics);
    const toastCounter = useRef(0);
    const navigate = useNavigate();

    const addToast = (type: 'success' | 'error', message: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const loadSellerPromotions = async (userId: string) => {
        const { data, error } = await supabase
            .from('promo')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching promotions:", error);
            return;
        }

        setPromotions((data || []).map((item) => toPromoRecord(item)));
    };

    const buildMetricSeriesFromRows = (
        rows: Array<any>,
        valueResolver: (row: any) => number,
        days = ANALYTICS_DAYS,
    ): MetricPoint[] => {
        const keys = buildLastDaysKeys(days);
        const bucket = new Map<string, number>();
        keys.forEach((key) => bucket.set(key, 0));

        rows.forEach((row) => {
            const metricDate = resolveMetricDate(row);
            if (!metricDate) return;
            const key = new Date(metricDate).toISOString().slice(0, 10);
            if (!bucket.has(key)) return;
            const current = bucket.get(key) || 0;
            bucket.set(key, current + valueResolver(row));
        });

        return keys.map((key) => ({ label: toDisplayLabel(key), value: bucket.get(key) || 0 }));
    };

    const loadSellerAnalytics = async (userId: string, sellerProducts: Array<any>) => {
        const productIds = sellerProducts.map((item) => item.id).filter(Boolean);

        if (productIds.length === 0) {
            setAnalytics(createEmptyAnalytics());
            return;
        }

        const numeric = (value: unknown) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const { data: favoriteRows, error: favoriteError } = await supabase
            .from('favorites')
            .select('product_id, created_at')
            .in('product_id', productIds);

        if (favoriteError) {
            console.error('Error fetching favorites analytics:', favoriteError);
        }

        const favoriteData = favoriteRows || [];

        const { data: viewsRows, error: viewsError } = await supabase
            .from('product_views')
            .select('*')
            .in('product_id', productIds)
            .limit(5000);

        if (viewsError) {
            console.error('Error fetching product views analytics:', viewsError);
        }

        const viewRows: Array<any> = viewsRows || [];
        const localViewRows: Array<any> = (() => {
            if (typeof window === 'undefined') return [];
            try {
                const raw = window.localStorage.getItem(LOCAL_PRODUCT_VIEWS_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(parsed)) return [];
                return parsed.filter((row: any) => row?.product_id && productIds.includes(row.product_id));
            } catch {
                return [];
            }
        })();
        const combinedViewRows = [...viewRows, ...localViewRows];

        const salesTableCandidates = ['sales', 'orders', 'transactions'];
        const salesRows: Array<any> = [];
        const seenSalesRows = new Set<string>();

        const pushUniqueSalesRows = (rows: Array<any>) => {
            rows.forEach((row) => {
                const identity = String(
                    row?.id
                    || `${row?.order_id || ''}-${row?.product_id || ''}-${resolveMetricDate(row) || ''}-${row?.amount || row?.total_amount || row?.total || row?.price || ''}`
                );
                if (!seenSalesRows.has(identity)) {
                    seenSalesRows.add(identity);
                    salesRows.push(row);
                }
            });
        };

        for (const table of salesTableCandidates) {
            const bySeller = await supabase
                .from(table)
                .select('*')
                .eq('seller_id', userId)
                .order('created_at', { ascending: false })
                .limit(500);

            if (!bySeller.error && Array.isArray(bySeller.data)) {
                pushUniqueSalesRows(bySeller.data);
            }

            const byProduct = await supabase
                .from(table)
                .select('*')
                .in('product_id', productIds)
                .order('created_at', { ascending: false })
                .limit(500);

            if (!byProduct.error && Array.isArray(byProduct.data)) {
                pushUniqueSalesRows(byProduct.data);
            }
        }

        const normalizedSalesRows = salesRows.filter((row) => {
            if (row?.product_id && productIds.includes(row.product_id)) return true;
            return row?.seller_id === userId;
        });

        const localSalesRows: Array<any> = (() => {
            if (typeof window === 'undefined') return [];
            try {
                const raw = window.localStorage.getItem(LOCAL_PRODUCT_SALES_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(parsed)) return [];
                return parsed.filter((row: any) => {
                    if (row?.product_id && productIds.includes(row.product_id)) return true;
                    return row?.seller_id === userId;
                });
            } catch {
                return [];
            }
        })();
        const combinedSalesRows = [...normalizedSalesRows, ...localSalesRows];

        const totalRevenue = combinedSalesRows.reduce((sum, row) => {
            const amount = numeric(row?.total_amount) || numeric(row?.amount) || numeric(row?.total) || numeric(row?.price);
            const quantity = Math.max(1, numeric(row?.quantity));
            return sum + amount * quantity;
        }, 0);

        const computedSalesSeries = buildMetricSeriesFromRows(combinedSalesRows, (row) => {
            const amount = numeric(row?.total_amount) || numeric(row?.amount) || numeric(row?.total) || numeric(row?.price);
            const quantity = Math.max(1, numeric(row?.quantity));
            return amount * quantity;
        });

        const hasVisibleSalesPoint = computedSalesSeries.some((point) => point.value > 0);
        const normalizedSalesSeries = (!hasVisibleSalesPoint && combinedSalesRows.length > 0)
            ? computedSalesSeries.map((point, index) => (
                index === computedSalesSeries.length - 1
                    ? { ...point, value: totalRevenue > 0 ? totalRevenue : 1 }
                    : point
            ))
            : computedSalesSeries;
        const finalSalesSeries = normalizedSalesSeries.length > 0
            ? normalizedSalesSeries
            : createEmptyMetricSeries();

        setAnalytics({
            totalViews: combinedViewRows.length,
            totalFavorites: favoriteData.length,
            totalSales: combinedSalesRows.length,
            totalRevenue,
            viewsSeries: buildMetricSeriesFromRows(combinedViewRows, () => 1),
            favoritesSeries: buildMetricSeriesFromRows(favoriteData, () => 1),
            salesSeries: finalSalesSeries,
        });
    };


    const checkAuthAndLoadProducts = async () => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;
            setCurrentUserId(userId);
            const { data: productsData, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                const productsWithPromotions = await attachScheduledPromosToProducts(productsData || []);
                setProducts(productsWithPromotions);
                await loadSellerAnalytics(userId, productsData || []);
            }

            await loadSellerPromotions(userId);
        } catch (error) {
            console.error("Error during authentication check and product loading:", error);
        }
    };

    const pushProductToDatabase = async (product: any) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([product])
                .select()
                .single();

            if (error) {
                console.error("Error inserting product:", error);
                return null;
            } else {
                return data; 
            }
        } catch (error) {
            console.error("Error during product insertion:", error);
            return null;
        }
    };

    const deleteProductFromDatabase = async (productId: string) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) {
                console.error("Error deleting product:", error);
                return false;
            } else {
                return true; 
            }
        } catch (error) {
            console.error("Error during product deletion:", error);
            return false;
        }
    };

    const pushUpdatedProductToDatabase = async (product: any) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .update(product)
                .eq('id', product.id)
                .select()
                .single();

            if (error) {
                console.error("Error updating product:", error);
                return null;
            } else {
                return data; 
            }
        } catch (error) {
            console.error("Error during product update:", error);
            return null;
        }
    };

   


    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
        checkAuthAndLoadProducts();
    }, []);

    const handleCreateProduct = () => {
        setShowCreateForm(true);
    };

    const handleCloseForm = () => {
        setShowCreateForm(false);
    };

    const handleProductCreated = async (newProduct: any) => {
    
        const savedProduct = await pushProductToDatabase(newProduct);
        
        if (savedProduct) {
          
            setProducts(prevProducts => [...prevProducts, savedProduct]);
        }
        
        setShowCreateForm(false);
    };

    const handleDeletePromo = async (promoId: string) => {
        const { error } = await supabase.from('promo').delete().eq('id', promoId);
        if (error) { addToast('error', 'Failed to delete promotion.'); return; }
        setPromotions(prev => prev.filter(p => p.id !== promoId));
        addToast('success', 'Promotion deleted.');
    };

    const handleTogglePromo = async (promo: SellerPromotion) => {
        const { error } = await supabase.from('promo').update({ is_active: !promo.is_active }).eq('id', promo.id);
        if (error) { addToast('error', 'Failed to update promotion.'); return; }
        setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
        addToast('success', promo.is_active ? 'Promotion disabled.' : 'Promotion enabled.');
    };

    const handleCreatePromoCode = async () => {
        setPromoError(null);
        setIsCreatingPromoCode(false);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            setPromoError('You must be logged in to create promo codes.');
            navigate('/login');
            return;
        }

        const currentUserId = session.user.id;
        setCurrentUserId(currentUserId);

        const normalizedCode = normalizePromoCode(promoCodeForm.code);
        const parsedValue = Number(promoCodeForm.value);

        if (!normalizedCode) {
            setPromoError('Promo code is required.');
            return;
        }

        if (!promoCodeForm.type) {
            setPromoError('Select a discount type.');
            return;
        }

        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            setPromoError('Promo value must be greater than 0.');
            return;
        }

        if (promoCodeForm.type === 'percentage' && parsedValue > 100) {
            setPromoError('Percentage cannot exceed 100.');
            return;
        }

        if (!promoCodeForm.productId) {
            setPromoError('Select one of your products for this promo code.');
            return;
        }

        const ownedProduct = products.find((item) => item.id === promoCodeForm.productId && item.user_id === currentUserId);

        if (!ownedProduct) {
            setPromoError('You can only create promo codes for your own products.');
            return;
        }

        const promoPayload = {
            code: normalizedCode,
            type: promoCodeForm.type,
            value: parsedValue,
            product_id: promoCodeForm.productId,
            user_id: currentUserId,
            is_active: true,
            promo_mode: 'code',
            start_date: null,
            end_date: null,
            title: null,
        };

        setIsCreatingPromoCode(true);

        const { data, error } = await supabase
            .from('promo')
            .insert([promoPayload])
            .select()
            .single();

        setIsCreatingPromoCode(false);

        if (error) {
            const message = error.message?.toLowerCase() || '';

            if (message.includes('row-level security') || message.includes('unauthorized promo creation')) {
                setPromoError('You can only create promo codes for your own products.');
                return;
            }

            if (message.includes('duplicate') || message.includes('unique')) {
                setPromoError('This promo code already exists. Choose another code.');
                return;
            }

            setPromoError(error.message || 'Failed to create promo code.');
            return;
        }

        addToast('success', `Promo code ${normalizedCode} created successfully.`);
        if (data) {
            setPromotions((prev) => [toPromoRecord(data), ...prev]);
        }
        setPromoCodeForm({ code: '', type: 'percentage', value: '', productId: '' });
    };

    const handleCreateScheduledPromo = async () => {
        setPromoError(null);
        setIsCreatingScheduledPromo(false);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            setPromoError('You must be logged in to create scheduled promotions.');
            navigate('/login');
            return;
        }

        const sellerId = session.user.id;
        const parsedValue = Number(scheduledPromoForm.value);

        if (!scheduledPromoForm.title.trim()) {
            setPromoError('Promotion title is required.');
            return;
        }

        if (!scheduledPromoForm.type) {
            setPromoError('Select a discount type.');
            return;
        }

        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            setPromoError('Promo value must be greater than 0.');
            return;
        }

        if (scheduledPromoForm.type === 'percentage' && parsedValue > 100) {
            setPromoError('Percentage cannot exceed 100.');
            return;
        }

        if (!scheduledPromoForm.productId) {
            setPromoError('Select one of your products for this scheduled promotion.');
            return;
        }

        if (!scheduledPromoForm.startDate || !scheduledPromoForm.endDate) {
            setPromoError('Start date and end date are required.');
            return;
        }

        if (new Date(scheduledPromoForm.startDate).getTime() > new Date(scheduledPromoForm.endDate).getTime()) {
            setPromoError('Start date must be before end date.');
            return;
        }

        const ownedProduct = products.find((item) => item.id === scheduledPromoForm.productId && item.user_id === sellerId);

        if (!ownedProduct) {
            setPromoError('You can only create scheduled promotions for your own products.');
            return;
        }

        const promoPayload = {
            code: null,
            title: scheduledPromoForm.title.trim(),
            type: scheduledPromoForm.type,
            value: parsedValue,
            product_id: scheduledPromoForm.productId,
            user_id: sellerId,
            is_active: true,
            promo_mode: 'scheduled',
            start_date: scheduledPromoForm.startDate,
            end_date: scheduledPromoForm.endDate,
        };

        setIsCreatingScheduledPromo(true);

        const { data, error } = await supabase
            .from('promo')
            .insert([promoPayload])
            .select()
            .single();

        setIsCreatingScheduledPromo(false);

        if (error) {
            const message = error.message?.toLowerCase() || '';

            if (message.includes('row-level security') || message.includes('unauthorized promo creation')) {
                setPromoError('You can only create promotions for your own products.');
                return;
            }

            setPromoError(error.message || 'Failed to create scheduled promotion.');
            return;
        }

        addToast('success', `Scheduled promotion "${scheduledPromoForm.title.trim()}" created successfully.`);
        if (data) {
            setPromotions((prev) => [toPromoRecord(data), ...prev]);
        }
        setScheduledPromoForm({ title: '', type: 'percentage', value: '', productId: '', startDate: '', endDate: '' });
        await checkAuthAndLoadProducts();
    };

    const getProductName = (productId?: string | null) => {
        const p = products.find((item) => item.id === productId);
        return p?.title || p?.name || 'Unlinked product';
    };

    const getProductImage = (productId?: string | null) => {
        const p = products.find((item) => item.id === productId);
        return p?.image_urls || null;
    };

    const getPromoStatus = (promo: SellerPromotion): 'active' | 'upcoming' | 'expired' | 'disabled' | 'code' => {
        if (!promo.is_active) return 'disabled';
        if (promo.promo_mode === 'code') return 'code';
        const now = new Date();
        if (promo.start_date && new Date(promo.start_date) > now) return 'upcoming';
        if (promo.end_date && new Date(promo.end_date) < now) return 'expired';
        return 'active';
    };

    const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
        active:   { label: 'Active',    dot: 'bg-emerald-400',  badge: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' },
        code:     { label: 'Active',    dot: 'bg-emerald-400',  badge: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' },
        upcoming: { label: 'Upcoming',  dot: 'bg-amber-400',    badge: 'border-amber-400/40 bg-amber-500/15 text-amber-300' },
        expired:  { label: 'Expired',   dot: 'bg-slate-500',    badge: 'border-slate-500/40 bg-slate-500/10 text-slate-400' },
        disabled: { label: 'Disabled',  dot: 'bg-slate-500',    badge: 'border-slate-500/40 bg-slate-500/10 text-slate-400' },
    };

    const now = new Date();
    const activePromos   = promotions.filter(p => p.is_active && (p.promo_mode === 'code' || isPromoCurrentlyActive(p, now)));
    const upcomingPromos = promotions.filter(p => p.is_active && p.promo_mode === 'scheduled' && p.start_date && new Date(p.start_date) > now);
    const discountedProducts = products.filter(p => p.hasScheduledPromo);

    const inputCls = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:bg-white/8 transition-all duration-200";
    const selectCls = inputCls + " appearance-none cursor-pointer";
    const viewsMax = Math.max(...analytics.viewsSeries.map((point) => point.value), 1);
    const viewStep = analytics.viewsSeries.length > 1 ? 100 / (analytics.viewsSeries.length - 1) : 100;
    const viewsPath = analytics.viewsSeries
        .map((point, index) => {
            const x = index * viewStep;
            const y = 100 - (point.value / viewsMax) * 100;
            return `${x},${y}`;
        })
        .join(' ');
    const salesSeries = analytics.salesSeries.length > 0 ? analytics.salesSeries : createEmptyMetricSeries();
    const salesMax = Math.max(...salesSeries.map((point) => point.value), 1);

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
            {/* Background glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl"></div>
            </div>

            {/* Toast notifications */}
            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-sm font-medium animate-slide-up transition-all ${t.type === 'success' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200' : 'bg-red-500/15 border-red-400/30 text-red-200'}`}>
                        {t.type === 'success'
                            ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                        {t.message}
                    </div>
                ))}
            </div>
            <br></br>
            <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-24 pb-8">

                {/* ─── Page header ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Seller Dashboard
                        </h1>
                        <p className="mt-0.5 text-xs text-white/50">Manage your listings, promotions, and analytics.</p>
                    </div>
                    <button
                        onClick={() => { handleCreateProduct(); setIsForUpdate(false); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-400 hover:to-purple-400 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Product
                    </button>
                </div>

                <br></br>
                <section className="mb-5 pb-5 border-b border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        {[
                            { label: 'Total Views', value: analytics.totalViews, color: 'text-indigo-300', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z' },
                            { label: 'Favorites', value: analytics.totalFavorites, color: 'text-pink-300', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                            { label: 'Sales', value: analytics.totalSales, color: 'text-emerald-300', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
                        ].map((kpi) => (
                            <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-white/45">{kpi.label}</p>
                                    <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={kpi.icon} />
                                    </svg>
                                </div>
                                <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                    <br></br>
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-white">Product Views</p>
                                <span className="text-xs text-white/40">Last 7 days</span>
                            </div>
                            <div className="h-24 rounded-lg bg-white/[0.03] border border-white/5 p-2">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                    <polyline
                                        fill="none"
                                        stroke="rgba(129, 140, 248, 0.95)"
                                        strokeWidth="2.5"
                                        points={viewsPath}
                                    />
                                </svg>
                            </div>
                            <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-white/35">
                                {analytics.viewsSeries.map((point) => (
                                    <span key={`view-${point.label}`} className="text-center truncate">{point.label}</span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-white">Sales Revenue</p>
                                <span className="text-xs text-white/40">Last 7 days</span>
                            </div>
                            <div className="h-24 flex items-end gap-1.5 rounded-lg bg-white/[0.03] border border-white/5 px-2 py-2">
                                {salesSeries.map((point) => {
                                    const hasSales = analytics.totalSales > 0 || analytics.totalRevenue > 0;
                                    const height = hasSales
                                        ? `${Math.max(12, (point.value / salesMax) * 100)}%`
                                        : '10%';
                                    return (
                                        <div key={`sales-${point.label}`} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                                            <div className={`w-full rounded-sm ${hasSales ? 'bg-gradient-to-t from-emerald-500/80 to-cyan-400/85' : 'bg-white/15'}`} style={{ height }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-white/35">
                                {salesSeries.map((point) => (
                                    <span key={`sales-date-${point.label}`} className="text-center truncate">{point.label}</span>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-emerald-300 font-semibold">{analytics.totalRevenue.toFixed(2)} € revenue</p>
                            {analytics.totalSales === 0 && (
                                <p className="mt-1 text-[11px] text-white/35">No sales yet in the last 7 days.</p>
                            )}
                        </div>
                    </div>
                </section>
                
                <br></br>
                {/* ─── Main 2-column layout ─── */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

                    {/* Left: tabbed form card (3 cols) */}
                    <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                        {/* Card header */}
                        <div className="px-5 pt-5 pb-3 border-b border-white/8">
                            <h2 className="text-sm font-semibold text-white">Create Promotion</h2>
                            <p className="text-xs text-white/40 mt-0.5">Both types are stored in a single promo table.</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-5 pt-3">
                            {(['code', 'scheduled'] as PromoTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActivePromoTab(tab); setPromoError(null); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePromoTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                >
                                    {tab === 'code' ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                            Promo Code
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            Scheduled
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Form body */}
                        <div className="px-5 pb-5 pt-3 space-y-3">
                            {activePromoTab === 'code' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5">Promo Code</label>
                                        <input type="text" value={promoCodeForm.code} onChange={e => setPromoCodeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" className={inputCls} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">Discount Type</label>
                                            <select value={promoCodeForm.type} onChange={e => setPromoCodeForm(p => ({ ...p, type: e.target.value as 'percentage'|'fixed' }))} className={selectCls}>
                                                <option className="bg-[#0f172a]" value="percentage">Percentage (%)</option>
                                                <option className="bg-[#0f172a]" value="fixed">Fixed (€)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">Value</label>
                                            <input type="number" min="0" step="0.01" value={promoCodeForm.value} onChange={e => setPromoCodeForm(p => ({ ...p, value: e.target.value }))} placeholder={promoCodeForm.type === 'percentage' ? '20' : '10.00'} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5">Linked Product</label>
                                        <select value={promoCodeForm.productId} onChange={e => setPromoCodeForm(p => ({ ...p, productId: e.target.value }))} className={selectCls}>
                                            <option className="bg-[#0f172a]" value="">Select a product…</option>
                                            {products.map(item => <option key={item.id} className="bg-[#0f172a]" value={item.id}>{item.title || item.name || 'Unnamed'}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5">Promotion Title</label>
                                        <input type="text" value={scheduledPromoForm.title} onChange={e => setScheduledPromoForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Sale" className={inputCls} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">Discount Type</label>
                                            <select value={scheduledPromoForm.type} onChange={e => setScheduledPromoForm(p => ({ ...p, type: e.target.value as 'percentage'|'fixed' }))} className={selectCls}>
                                                <option className="bg-[#0f172a]" value="percentage">Percentage (%)</option>
                                                <option className="bg-[#0f172a]" value="fixed">Fixed (€)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">Value</label>
                                            <input type="number" min="0" step="0.01" value={scheduledPromoForm.value} onChange={e => setScheduledPromoForm(p => ({ ...p, value: e.target.value }))} placeholder={scheduledPromoForm.type === 'percentage' ? '20' : '10.00'} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5">Linked Product</label>
                                        <select value={scheduledPromoForm.productId} onChange={e => setScheduledPromoForm(p => ({ ...p, productId: e.target.value }))} className={selectCls}>
                                            <option className="bg-[#0f172a]" value="">Select a product…</option>
                                            {products.map(item => <option key={item.id} className="bg-[#0f172a]" value={item.id}>{item.title || item.name || 'Unnamed'}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">
                                                <svg className="w-3 h-3 inline mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Start Date
                                            </label>
                                            <input type="date" value={scheduledPromoForm.startDate} onChange={e => setScheduledPromoForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls + " [color-scheme:dark]"} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5">
                                                <svg className="w-3 h-3 inline mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                End Date
                                            </label>
                                            <input type="date" value={scheduledPromoForm.endDate} onChange={e => setScheduledPromoForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls + " [color-scheme:dark]"} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {promoError && (
                                <div className="flex items-center gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    {promoError}
                                </div>
                            )}

                            <button
                                onClick={activePromoTab === 'code' ? handleCreatePromoCode : handleCreateScheduledPromo}
                                disabled={(activePromoTab === 'code' ? isCreatingPromoCode : isCreatingScheduledPromo) || products.length === 0}
                                className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:from-indigo-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {activePromoTab === 'code'
                                    ? (isCreatingPromoCode ? 'Creating…' : 'Create Promo Code')
                                    : (isCreatingScheduledPromo ? 'Creating…' : 'Create Scheduled Promotion')
                                }
                            </button>
                            {products.length === 0 && (
                                <p className="text-center text-xs text-white/30">Add a product first to create promotions.</p>
                            )}
                        </div>
                    </div>

                    {/* Right: info widgets (2 cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Quick stats */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <h3 className="text-xs font-semibold text-white mb-3">Promotion Overview</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Active now',   value: activePromos.length,   color: 'text-emerald-300', barColor: 'bg-emerald-500' },
                                    { label: 'Upcoming',     value: upcomingPromos.length, color: 'text-amber-300',   barColor: 'bg-amber-500' },
                                    { label: 'Total created', value: promotions.length,    color: 'text-indigo-300',  barColor: 'bg-indigo-500' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-white/50">{row.label}</span>
                                                <span className={`text-xs font-bold ${row.color}`}>{row.value}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/5">
                                                <div className={`h-full rounded-full ${row.barColor}/70 transition-all`} style={{ width: promotions.length > 0 ? `${Math.min(100, (row.value / promotions.length) * 100)}%` : '0%' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                <span className="text-sm font-semibold text-indigo-200">Quick Tips</span>
                            </div>
                            <ul className="space-y-2.5 text-xs text-white/50">
                                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold mt-0.5">→</span>Promo codes are entered manually by shoppers at checkout.</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold mt-0.5">→</span>Scheduled promos apply discounts automatically based on dates.</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold mt-0.5">→</span>Disable a promotion without deleting it to reuse later.</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold mt-0.5">→</span>Percentage discounts are calculated on the original price.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ─── Promotions list ─── */}
                <section className="mb-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Your Promotions</h2>
                            <p className="text-xs text-white/40 mt-0.5">{promotions.length} total · all stored in the same promo table</p>
                        </div>
                    </div>

                    {promotions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                            <svg className="w-10 h-10 mx-auto mb-3 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            <p className="text-sm text-white/30">No promotions created yet.</p>
                            <p className="text-xs text-white/20 mt-1">Use the form above to create your first promotion.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {promotions.map(promo => {
                                const status = getPromoStatus(promo);
                                const cfg = statusConfig[status];
                                const valueLabel = promo.type === 'percentage' ? `${promo.value}% OFF` : `${promo.value.toFixed(2)} € OFF`;
                                const productImg = getProductImage(promo.product_id);

                                return (
                                    <div key={promo.id} className="group rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3.5 flex flex-col gap-2 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200">
                                        {/* Top row: icon + name + status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {productImg ? (
                                                    <img src={productImg} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                                                ) : (
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${promo.promo_mode === 'code' ? 'bg-indigo-500/15 border border-indigo-500/25' : 'bg-amber-500/15 border border-amber-500/25'}`}>
                                                        {promo.promo_mode === 'code'
                                                            ? <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                                            : <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        }
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate leading-tight">
                                                        {promo.promo_mode === 'code' ? (promo.code || '—') : (promo.title || '—')}
                                                    </p>
                                                    <p className="text-[11px] text-white/35 truncate">
                                                        {promo.promo_mode === 'code' ? 'Promo Code' : 'Scheduled'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${cfg.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Discount value */}
                                        <div className="rounded-lg bg-white/5 border border-white/8 px-3 py-1.5 flex items-center justify-between">
                                            <span className="text-base font-bold text-white">{valueLabel}</span>
                                            <span className="text-[10px] text-white/35 uppercase">{promo.type === 'percentage' ? 'percent' : 'fixed'}</span>
                                        </div>

                                        {/* Meta */}
                                        <div className="space-y-1">
                                            <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                {getProductName(promo.product_id)}
                                            </p>
                                            {promo.promo_mode === 'scheduled' && (promo.start_date || promo.end_date) && (
                                                <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {promo.start_date || '?'} → {promo.end_date || '?'}
                                                </p>
                                            )}
                                            {promo.created_at && (
                                                <p className="text-[11px] text-white/25">Created {new Date(promo.created_at).toLocaleDateString()}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end gap-1.5 pt-2 mt-1 border-t border-white/8">
                                            <button
                                                onClick={() => handleTogglePromo(promo)}
                                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${promo.is_active ? 'border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80' : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                                            >
                                                {promo.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => handleDeletePromo(promo.id)}
                                                className="px-2.5 py-1 rounded-md border border-red-500/20 text-[11px] text-red-400/70 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/40 transition-all"
                                                aria-label="Delete promotion"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ─── Products section ─── */}
                <section className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Products Eligible for Promotions</h2>
                            <p className="text-xs text-white/40 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} · hover to edit or delete</p>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-sm text-white/30 mb-4">No products yet. Add your first listing.</p>
                            <button onClick={() => { handleCreateProduct(); setIsForUpdate(false); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:from-indigo-400 hover:to-purple-400 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {products.map(prod => {
                                const activePromo = promotions.find(pr => pr.product_id === prod.id && pr.is_active && (pr.promo_mode === 'code' || isPromoCurrentlyActive(pr, now)));
                                return (
                                    <div
                                        key={prod.id}
                                        className="group relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                                        onClick={() => navigate(`/products/${prod.id}`)}
                                    >
                                        {/* promo badge */}
                                        {activePromo && (
                                            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                                                {/* Title badge */}
                                                {(activePromo.title || activePromo.promo_mode === 'code') && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/15 shadow-xl">
                                                        <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M13 6a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM13 18a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                                        <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                                                            {activePromo.title || 'Promo Code'}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Discount badge */}
                                                <div className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500/95 to-cyan-500/95 border border-emerald-300/50 shadow-2xl shadow-emerald-600/40 backdrop-blur-md">
                                                    <span className="text-[11px] font-black text-white drop-shadow-lg">
                                                        {activePromo.type === 'percentage' ? `${activePromo.value}% OFF` : `${activePromo.value.toFixed(0)}€ OFF`}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* image */}
                                        <div className="relative aspect-square overflow-hidden bg-white/5">
                                            <img
                                                src={prod.image_urls || '/placeholder-image.jpg'}
                                                alt={prod.title || 'Product'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* hover actions */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-indigo-500/50 transition"
                                                    onClick={e => { e.stopPropagation(); setShowCreateForm(true); setIsForUpdate(true); setProduct(prod); }}
                                                    aria-label="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-red-500/50 transition"
                                                    onClick={e => { e.stopPropagation(); deleteProductFromDatabase(prod.id).then(ok => { if (ok) setProducts(prev => prev.filter(p => p.id !== prod.id)); }); }}
                                                    aria-label="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* info */}
                                        <div className="p-3">
                                            <p className="text-xs font-semibold text-white truncate">{prod.title || prod.name || 'Unnamed'}</p>
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                {prod.hasScheduledPromo ? (
                                                    <>
                                                        <span className="text-xs text-white/35 line-through">${(prod.price ?? 0).toFixed(2)}</span>
                                                        <span className="text-xs font-bold text-emerald-400">${(prod.displayPrice ?? prod.price ?? 0).toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-bold text-white/70">${(prod.price ?? 0).toFixed(2)}</span>
                                                )}
                                            </div>
                                            {prod.category && (
                                                <span className="mt-1.5 inline-block text-[10px] bg-white/8 text-white/40 px-1.5 py-0.5 rounded-md">{prod.category}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>

            {/* ─── Create/Edit product modal ─── */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <button
                            onClick={handleCloseForm}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/15 text-white hover:bg-red-500/20 hover:text-red-300 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="rounded-2xl border border-white/15 bg-[#0f172a] p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6">
                                {!isForUpdate ? 'New Product' : 'Edit Product'}
                            </h2>
                            {!isForUpdate ? (
                                <ProductCreationForm onProductCreated={handleProductCreated} onCancel={handleCloseForm} isForUpdate={false} initialData={null} />
                            ) : (
                                <ProductCreationForm
                                    onProductCreated={async (updatedProduct) => {
                                        const savedProduct = await pushUpdatedProductToDatabase({ ...product, ...updatedProduct });
                                        if (savedProduct) setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
                                        setShowCreateForm(false);
                                    }}
                                    onCancel={handleCloseForm}
                                    isForUpdate={true}
                                    initialData={product}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProducts;