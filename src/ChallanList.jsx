import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { config } from './config';

const ChallanList = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'created_at', 
    direction: 'desc' 
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchChallans();
  }, [searchTerm, sortConfig, dateFilter]);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sort: sortConfig.key,
        order: sortConfig.direction.toUpperCase(),
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate
      });

      const response = await fetch(`${config.apiUrl}/api/list-challans?${params}`);
      if (!response.ok) throw new Error('Failed to fetch challans');
      
      const data = await response.json();
      setChallans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (challanId) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/download-pdf/${challanId}`);
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `challan_${challanId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF');
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Challan List</h1>
      
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by customer or challan number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded flex-grow"
        />
        
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading challans...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th 
                onClick={() => handleSort('customer_name')} 
                className="p-2 border cursor-pointer hover:bg-gray-200"
              >
                Customer Name
              </th>
              <th 
                onClick={() => handleSort('challan_no')} 
                className="p-2 border cursor-pointer hover:bg-gray-200"
              >
                Challan No
              </th>
              <th 
                onClick={() => handleSort('created_at')} 
                className="p-2 border cursor-pointer hover:bg-gray-200"
              >
                Date
              </th>
              <th 
                onClick={() => handleSort('total_items')} 
                className="p-2 border cursor-pointer hover:bg-gray-200"
              >
                Total Items
              </th>
              <th 
                onClick={() => handleSort('total_price')} 
                className="p-2 border cursor-pointer hover:bg-gray-200"
              >
                Total Price
              </th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((challan) => (
              <tr key={challan.id} className="hover:bg-gray-50">
                <td className="p-2 border">{challan.customer_name}</td>
                <td className="p-2 border">{challan.challan_no}</td>
                <td className="p-2 border">
                  {format(new Date(challan.created_at), 'dd-MM-yyyy')}
                </td>
                <td className="p-2 border text-right">{challan.total_items}</td>
                <td className="p-2 border text-right">Rs {challan.total_price.toFixed(2)}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => downloadPDF(challan.id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ChallanList;