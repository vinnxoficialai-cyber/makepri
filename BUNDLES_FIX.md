    const handleSaveBundle = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!bundleForm.bundleComponents || bundleForm.bundleComponents.length < 2) {
            alert("Adicione pelo menos 2 produtos ao kit.");
            return;
        }

        try {
            const productData = {
                name: bundleForm.name || 'Novo Kit',
                sku: bundleForm.sku || `KIT-${Math.floor(Math.random()*1000)}`,
                category: ProductCategory.BUNDLE,
                type: 'bundle' as const,
                priceSale: Number(bundleForm.priceSale),
                priceCost: calculateBundleCost(bundleForm.bundleComponents),
                stock: calculateBundleStock(bundleForm.bundleComponents),
                minStock: 5,
                unit: 'kit',
                imageUrl: 'https://picsum.photos/205',
                description: 'Kit promocional'
            };

            await BundleService.createBundle(productData, bundleForm.bundleComponents);
            await refresh(); // Reload products
            setIsModalOpen(false);
            setBundleForm({
                name: '', sku: '', priceSale: 0, bundleComponents: [], type: 'bundle', category: ProductCategory.BUNDLE
            });
        } catch (error) {
            console.error('Error creating bundle:', error);
            alert('Erro ao criar kit. Verifique o console.');
        }
    };
