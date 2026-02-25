import React from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

interface FilterModalProps {
    show: boolean
    onHide: () => void
    dateFilter: 'all' | 'today' | 'weekly' | 'monthly' | 'custom'
    setDateFilter: (filter: 'all' | 'today' | 'weekly' | 'monthly' | 'custom') => void
    startDate: string
    setStartDate: (date: string) => void
    endDate: string
    setEndDate: (date: string) => void
    paymentMethodFilter: string
    setPaymentMethodFilter: (method: string) => void
    uniquePaymentMethods: string[]
    onApplyFilters: () => void
    onResetFilters: () => void
}

const FilterModal: React.FC<FilterModalProps> = ({
    show,
    onHide,
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    paymentMethodFilter,
    setPaymentMethodFilter,
    uniquePaymentMethods,
    onApplyFilters,
    onResetFilters,
}) => {
    const handleApply = () => {
        onApplyFilters()
        onHide()
    }

    const handleReset = () => {
        onResetFilters()
        onHide()
    }

    return (
        <Modal 
            show={show} 
            onHide={onHide}
            centered
            size="lg"
            backdrop="static"
        >
            <Modal.Header className="bg-primary text-white">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <i className="bi bi-funnel"></i>
                    Filter Sales Report
                </Modal.Title>
                <Button 
                    variant="light" 
                    className="btn-close-white ms-auto" 
                    onClick={onHide}
                >
                    <i className="bi bi-x-lg"></i>
                </Button>
            </Modal.Header>
            
            <Modal.Body className="p-4">
                <Form>
                    {/* Date Range Filter */}
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-range text-primary"></i>
                            Date Range
                        </Form.Label>
                        <Form.Select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="shadow-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="weekly">Last 7 Days</option>
                            <option value="monthly">This Month</option>
                            <option value="custom">Custom Range</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-6">
                                <Form.Label className="fw-semibold">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    Start Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="shadow-sm"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <Form.Label className="fw-semibold">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    End Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Payment Method Filter */}
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                            <i className="bi bi-credit-card text-primary"></i>
                            Payment Method
                        </Form.Label>
                        <Form.Select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="shadow-sm"
                        >
                            <option value="all">All Methods</option>
                            {uniquePaymentMethods.map(method => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Filter Summary */}
                    {/* <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
                        <i className="bi bi-info-circle"></i>
                        <div className="flex-grow-1">
                            <strong>Active Filters:</strong>
                            <ul className="mb-0 mt-2 ps-3">
                                <li>Date Range: <span className="badge bg-primary">
                                    {dateFilter === 'all' ? 'All Time' :
                                     dateFilter === 'today' ? 'Today' :
                                     dateFilter === 'weekly' ? 'Last 7 Days' :
                                     dateFilter === 'monthly' ? 'This Month' :
                                     startDate && endDate ? `${startDate} to ${endDate}` : 'Custom Range'}
                                </span></li>
                                <li>Payment Method: <span className="badge bg-primary">
                                    {paymentMethodFilter === 'all' ? 'All Methods' : paymentMethodFilter}
                                </span></li>
                            </ul>
                        </div>
                    </div> */}
                </Form>
            </Modal.Body>
            
            <Modal.Footer className="bg-light">
                <div className="d-flex justify-content-between w-100">
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleReset}
                        className="d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Reset Filters
                    </Button>
                    <div className="d-flex gap-2">
                        {/* <Button 
                            variant="secondary" 
                            onClick={onHide}
                            className="d-flex align-items-center gap-2"
                        >
                            <i className="bi bi-x-lg"></i>
                            Cancel
                        </Button> */}
                        {/* <Button 
                            variant="primary" 
                            onClick={handleApply}
                            className="d-flex align-items-center gap-2"
                        >
                            <i className="bi bi-check-lg"></i>
                            Apply Filters
                        </Button> */}
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default FilterModal
