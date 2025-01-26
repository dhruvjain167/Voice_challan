import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RecordRTC from 'recordrtc';
import { parseVoiceInput } from './utils';
import ChallanList from './ChallanList';
import { API_URL } from './config';

const App = () => {
  const [voiceText, setVoiceText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [success, setSuccess] = useState('');
  const [editablePrices, setEditablePrices] = useState({});
  const [isPriceEditMode, setIsPriceEditMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const recorder = useRef(null);
  const stream = useRef(null);
  const audioInputRef = useRef(null);

  // Responsive design check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVoiceInput = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recorder.current = new RecordRTC(stream.current, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        bufferSize: 16384
      });

      recorder.current.startRecording();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error('Recording error:', err);
      
      if (isMobile) {
        audioInputRef.current.click();
      } else {
        setError('Error accessing microphone. Please ensure microphone permissions are granted.');
        setIsListening(false);
      }
    }
  };

  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const audioBlob = new Blob([file], { type: 'audio/wav' });
      await translateAudioToText(audioBlob);
    }
  };

  const stopRecording = () => {
    if (recorder.current && isListening) {
      recorder.current.stopRecording(() => {
        const blob = recorder.current.getBlob();
        translateAudioToText(blob);
        
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
        }
        setIsListening(false);
      });
    }
  };

  const translateAudioToText = async (audioBlob) => {
    const form = new FormData();
    form.append("file", audioBlob, "audio.wav");

    const options = {
      method: 'POST',
      headers: {
        'api-subscription-key': 'cf25e1fb-2802-4189-9e1b-ef8a5d4d1e4d',
      },
      body: form
    };

    try {
      const response = await fetch('https://api.sarvam.ai/speech-to-text-translate', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transcript = data.transcript || '';
      setVoiceText(transcript);
      const items = parseVoiceInput(transcript);
      setParsedItems(items);
    } catch (error) {
      console.error('Error translating audio to text:', error);
      setError('Failed to convert speech to text');
    }
  };

  const updateItemPrice = (index, price) => {
    const newPrices = { ...editablePrices, [index]: price };
    setEditablePrices(newPrices);
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setError('Please enter a customer name');
      return false;
    }
    if (!challanNo.trim()) {
      setError('Please enter a challan number');
      return false;
    }
    if (parsedItems.length === 0) {
      setError('Please record at least one item');
      return false;
    }
    return true;
  };

  const generatePDF = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingPDF(true);
    setError(null);
    setSuccess('');

    const itemsWithPrices = parsedItems.map((item, index) => ({
      ...item,
      price: editablePrices[index] || 0
    }));

    const requestData = {
      items: itemsWithPrices,
      customerName: customerName.trim(),
      challanNo: challanNo.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const data = await response.json();
      
      // Download the generated PDF
      const pdfResponse = await fetch(`${API_URL}/api/download-pdf/${data.challanId}`);
      if (!pdfResponse.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `challan_${challanNo.trim()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('PDF generated successfully!');
      clearForm();

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const clearForm = () => {
    setCustomerName('');
    setChallanNo('');
    setParsedItems([]);
    setVoiceText('');
    setError(null);
    setSuccess('');
    setEditablePrices({});
    setIsPriceEditMode(false);
  };

  const activatePriceEditMode = () => {
    setIsPriceEditMode(true);
    const initialPrices = parsedItems.reduce((acc, _, idx) => {
      acc[idx] = editablePrices[idx] || 0;
      return acc;
    }, {});
    setEditablePrices(initialPrices);
  };

  const NavBar = () => (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Voice Challan Generator</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:text-gray-300">Generate Challan</Link>
          <Link to="/list" className="hover:text-gray-300">Challan List</Link>
        </div>
      </div>
    </nav>
  );

  const ChallanGenerator = () => (
    <div className={`py-8 ${isMobile ? 'px-2' : 'px-4'}`}>
      <div className={`mx-auto ${isMobile ? 'w-full' : 'max-w-2xl'}`}>
        <div className={`bg-white rounded-lg shadow p-6 ${isMobile ? 'p-3' : ''}`}>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                id="customerName"
                type="text"
                placeholder="Enter customer name"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="challanNo" className="block text-sm font-medium text-gray-700 mb-1">
                Challan Number
              </label>
              <input
                id="challanNo"
                type="text"
                placeholder="Enter challan number"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6 flex-wrap">
            <button
              onClick={handleVoiceInput}
              className={`px-4 py-2 rounded ${
                isListening ? 'bg-red-500' : 'bg-blue-500'
              } text-white hover:opacity-90 transition-opacity`}
              disabled={isListening}
            >
              {isListening ? 'Recording...' : 'Start Recording'}
            </button>
            
            <button
              onClick={stopRecording}
              className="px-4 py-2 rounded bg-gray-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={!isListening}
            >
              Stop
            </button>
            
            <input 
              type="file" 
              ref={audioInputRef} 
              accept="audio/*" 
              className="hidden" 
              onChange={handleFileInput} 
            />
            
            {parsedItems.length > 0 && !isPriceEditMode && (
              <button
                onClick={activatePriceEditMode}
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:opacity-90"
              >
                Add Prices
              </button>
            )}
            
            {isPriceEditMode && (
              <button
                onClick={generatePDF}
                className="px-4 py-2 rounded bg-green-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
              </button>
            )}
            
            <button
              onClick={clearForm}
              className="px-4 py-2 rounded bg-gray-400 text-white hover:opacity-90 transition-opacity"
            >
              Clear Form
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {voiceText && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Recognized Text:</h3>
              <p className="p-2 bg-gray-100 rounded">{voiceText}</p>
            </div>
          )}

          {parsedItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Parsed Items:</h3>
              <div className="space-y-2">
                {parsedItems.map((item, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded flex justify-between items-center flex-wrap gap-2">
                    <span className="font-medium">Quantity: {item.quantity}</span>
                    <span>Description: {item.description}</span>
                    {isPriceEditMode && (
                      <input
                        type="number"
                        placeholder="Enter price"
                        value={editablePrices[index] || ''}
                        onChange={(e) => updateItemPrice(index, parseFloat(e.target.value))}
                        className="w-20 p-1 border rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <Routes>
          <Route path="/" element={<ChallanGenerator />} />
          <Route path="/list" element={<ChallanList />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;