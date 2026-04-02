import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)


export const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? user.id : null;
};

export const getUserNameById = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data;
}

export const getProductById = async (productId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data;
}

export const getConversationById = async (conversationId) => {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

    if (error) {
        console.error('Error fetching conversation:', error);
        return null;
    }

    return data;
}

export const deleteConversationById = async (conversationId) => {
    const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

    if (error) {
        console.error('Error deleting conversation:', error);
        return false;
    }

    return true;
}

export const insertNewFavorite = async (userId, productId) => {
    const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id: productId });

    if (error) {
        console.error('Error inserting favorite:', error);
        return false;
    }

    return true;
}

export const deleteFavorite = async (userId, productId) => {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('Error deleting favorite:', error);
        return false;
    }

    return true;
}

export const getFavoritesByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
    return data;
}

export const addAppreciation = async (productId, userId, note, comment) => {
    // Normalize and validate note (rating)
    const numericNote = Number(note);
    if (!Number.isFinite(numericNote)) {
        console.error('Invalid appreciation note, expected a finite number:', note);
        return false;
    }
    // Clamp to allowed range 1–5 and round to nearest integer
    const clampedNote = Math.min(5, Math.max(1, Math.round(numericNote)));

    // Normalize and limit comment
    const MAX_COMMENT_LENGTH = 500;
    let sanitizedComment = typeof comment === 'string' ? comment.trim() : null;
    if (sanitizedComment && sanitizedComment.length > MAX_COMMENT_LENGTH) {
        sanitizedComment = sanitizedComment.slice(0, MAX_COMMENT_LENGTH);
    }

    const { error } = await supabase
        .from('product_appreciation')
        .insert({
            product_id: productId,
            user_id: userId,
            note: clampedNote,
            comment: sanitizedComment
        });

    if (error) {
        console.error('Error adding appreciation:', error);
        return false;
    }

    return true;
};

export const getAppreciationsByProductId = async (productId) => {
    const { data, error } = await supabase
        .from('product_appreciation')
        .select('id, product_id, user_id, note, comment, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching appreciations:', error);
        return [];
    }
    return data;
};