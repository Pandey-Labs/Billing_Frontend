import React from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

interface DashboardFilterModalProps {
    show: boolean
    onHide: () => void
    dateFilter: string
    setDateFilter: (filter: string) => void
    paymentFilter: string
    setPaymentFilter: (filter: string) => void
    startDate: string
    setStartDate: (date: string) => void
    endDate: string
    setEndDate: (date: string) => void
    onApplyFilters: () => void
    onResetFilters: () => void
}

const paymentModes = ["All", "Cash", "UPI", "Card", "Wallet"]
const dateRanges = ["Today", "Yesterday", "Weekly", "Monthly", "Custom"]

const DashboardFilterModal: React.FC<DashboardFilterModalProps> = ({
    show,
    onHide,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
                    Dashboard Filters
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
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="shadow-sm"
                        >
                            {dateRanges.map((range) => (
                                <option key={range} value={range}>
                                    {range}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Custom Date Range */}
                    {dateFilter === 'Custom' && (
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
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="shadow-sm"
                        >
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>
                                    {mode}
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
                                    {dateFilter === 'Custom' && startDate && endDate ? 
                                        `${startDate} to ${endDate}` : dateFilter}
                                </span></li>
                                <li>Payment Method: <span className="badge bg-primary">
                                    {paymentFilter}
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
                    {/* s */}
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default DashboardFilterModal
