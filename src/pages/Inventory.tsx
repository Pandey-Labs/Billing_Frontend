import React from 'react'
import { useAppSelector } from '../store/hooks'


const Inventory: React.FC = () => {
    const products = useAppSelector(s => s.products.items)
    return (
        <div>
            <h3>Inventory</h3>
            <div className="list-group">
                {products.map(p => (
                    <div key={p.id} className={`list-group-item d-flex justify-content-between align-items-center ${p.stock < 5 ? 'list-group-item-danger' : ''}`}>
                        <div>
                            <div><strong>{p.name}</strong> <small className="text-muted">({p.sku})</small></div>
                            <div className="small">Category: {p.category} | Price: {p.price} | Tax: {p.taxPercent}%</div>
                        </div>
                        <div>
                            <span className="badge bg-primary rounded-pill">{p.stock}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default Inventory