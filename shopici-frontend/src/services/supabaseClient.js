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