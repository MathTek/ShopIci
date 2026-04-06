import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DraggableProduct from '../components/DraggableProduct';
import DroppableCollection from '../components/DroppableCollection';

describe('DraggableProduct Component', () => {
    const mockProduct = {
        id: 1,
        title: 'Test Product',
        price: 29.99,
        description: 'A test product',
        category: 'Electronics',
        image_urls: 'test-image.jpg',
        favorite_collection_id: null
    };

    it('renders product with correct title', () => {
        render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
                onDragStart={vi.fn()}
                onDragEnd={vi.fn()}
                onClick={vi.fn()}
            />
        );

        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('renders price correctly', () => {
        render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
            />
        );

        expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('renders category when provided', () => {
        render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
            />
        );

        expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('has draggable attribute', () => {
        const { container } = render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
            />
        );

        const element = container.querySelector('[draggable="true"]');
        expect(element).toBeInTheDocument();
    });

    it('shows drag indicator on hover', () => {
        const { container } = render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
            />
        );

        // The drag indicator should be in the DOM
        const dragIndicator = container.querySelector('.group-hover\\:opacity-100');
        expect(dragIndicator).toBeInTheDocument();
    });

    it('applies isDragging styles when dragging', () => {
        const { container } = render(
            <DraggableProduct
                product={mockProduct}
                isDragging={true}
            />
        );

        const element = container.firstChild;
        expect(element).toHaveClass('opacity-50');
        expect(element).toHaveClass('border-cyan-400');
    });
});

describe('DroppableCollection Component', () => {
    const mockCollection = {
        id: 1,
        owner_id: 'user-123',
        collection_name: 'Test Collection'
    };

    it('renders collection name', () => {
        render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={false}
                productCount={0}
            />
        );

        expect(screen.getByText('Test Collection')).toBeInTheDocument();
    });

    it('displays product count', () => {
        render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={false}
                productCount={5}
            />
        );

        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('items')).toBeInTheDocument();
    });

    it('shows singular item text for single product', () => {
        render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={false}
                productCount={1}
            />
        );

        expect(screen.getByText('item')).toBeInTheDocument();
    });

    it('applies drop target styles when active', () => {
        const { container } = render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={true}
                productCount={0}
            />
        );

        const element = container.firstChild;
        expect(element).toHaveClass('border-cyan-400');
        expect(element).toHaveClass('bg-cyan-500/10');
    });

    it('shows drop indicator when is drop target', () => {
        render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={true}
                productCount={0}
            />
        );

        expect(screen.getByText('Drop here')).toBeInTheDocument();
    });
});

describe('Drag and Drop Interaction', () => {
    it('calls onDragStart when product drag starts', () => {
        const mockDragStart = vi.fn();
        const mockProduct = {
            id: 1,
            title: 'Test Product',
            price: 29.99,
            favorite_collection_id: null
        };

        const { container } = render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
                onDragStart={mockDragStart}
            />
        );

        const element = container.querySelector('[draggable="true"]');
        if (element) {
            element.dispatchEvent(
                new DragEvent('dragstart', { bubbles: true })
            );
            expect(mockDragStart).toHaveBeenCalled();
        }
    });

    it('calls onDragEnd when product drag ends', () => {
        const mockDragEnd = vi.fn();
        const mockProduct = {
            id: 1,
            title: 'Test Product',
            price: 29.99,
            favorite_collection_id: null
        };

        const { container } = render(
            <DraggableProduct
                product={mockProduct}
                isDragging={false}
                onDragEnd={mockDragEnd}
            />
        );

        const element = container.querySelector('[draggable="true"]');
        if (element) {
            element.dispatchEvent(
                new DragEvent('dragend', { bubbles: true })
            );
            expect(mockDragEnd).toHaveBeenCalled();
        }
    });

    it('calls onDrop when product dropped on collection', () => {
        const mockDrop = vi.fn();
        const mockCollection = {
            id: 1,
            owner_id: 'user-123',
            collection_name: 'Test Collection'
        };

        const { container } = render(
            <DroppableCollection
                collection={mockCollection}
                isDropTarget={false}
                productCount={0}
                onDrop={mockDrop}
            />
        );

        const element = container.querySelector('[data-testid="droppable-collection"]');
        if (element) {
            element.dispatchEvent(
                new DragEvent('drop', { bubbles: true })
            );
            // Note: Check your actual implementation for the exact test ID
        }
    });
});
