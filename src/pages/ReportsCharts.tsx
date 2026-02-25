import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts'

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14']

export default function ReportsCharts({
    monthlySalesData,
    paymentMethodData,
    weeklyTrendData,
    dailyProfitData,
    renderTooltip,
}: any) {
    return (
        <>
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-6">
                    <div className="card themed-card">
                        <div className="card-body">
                            <h6 className="fw-bold">Revenue & Profit (Last 7 days)</h6>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#198754" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" />
                                        <YAxis tickFormatter={(v) => `₹${v}`} />
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <Tooltip formatter={renderTooltip} />
                                        <Area type="monotone" dataKey="revenue" stroke="#0d6efd" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                        <Area type="monotone" dataKey="profit" stroke="#198754" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card themed-card">
                        <div className="card-body">
                            <h6 className="fw-bold">Daily Profit</h6>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <BarChart data={dailyProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="day" />
                                        <YAxis tickFormatter={(v) => `₹${v}`} />
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <Tooltip formatter={renderTooltip} />
                                        <Bar dataKey="profit" fill="#198754" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-6">
                    <div className="card themed-card">
                        <div className="card-body">
                            <h6 className="fw-bold">Monthly Sales</h6>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <LineChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(v) => `₹${v}`} />
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <Tooltip formatter={renderTooltip} />
                                        <Line type="monotone" dataKey="sales" stroke="#198754" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card themed-card">
                        <div className="card-body">
                            <h6 className="fw-bold">Sales by Payment Method</h6>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={paymentMethodData} dataKey="value" nameKey="name" outerRadius={80} label>
                                            {paymentMethodData.map((_entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={renderTooltip} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
