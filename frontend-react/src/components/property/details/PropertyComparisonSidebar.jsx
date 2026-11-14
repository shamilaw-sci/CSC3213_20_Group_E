import MortgageCalculator from '../MortgageCalculator';

export default function PropertyComparisonSidebar({ property, compareList, addToCompare, removeFromCompare }) {
    return (
                    <div className="col-span-1 space-y-6">
                        
                        {/* Mortgage Calculator Component */}
                        {property.price && property.listing_type?.toLowerCase() !== 'rent' && !property.type?.includes('Rent') && (
                            <div className="sticky top-24">
                                <MortgageCalculator propertyPrice={property.price} />
                            </div>
                        )}
                        
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Compare Properties</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add this property to your comparison list to evaluate it against others.</p>
                            <button aria-label="Compare Property" type="button" 
                                onClick={() => {
                                    const isCompared = compareList.some(p => p.id === property.id);
                                    isCompared ? removeFromCompare(property.id) : addToCompare(property);
                                }}
                                className={`w-full font-bold py-3 rounded-xl transition-all border flex items-center justify-center gap-2 text-sm ${
                                    compareList.some(p => p.id === property.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {compareList.some(p => p.id === property.id) ? 'Added to Compare' : 'Add to Compare'}
                            </button>
                        </div>

                    </div>
    );
}
