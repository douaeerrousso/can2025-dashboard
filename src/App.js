import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, TrendingUp, Activity, Upload, Camera } from 'lucide-react';

const SUPABASE_URL = "https://qpwwceigajtigvhpmbpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_hYAcKlZbCfCdW-SzdiEIDA_Ng7jGwO7";

// URL Railway extraite de vos paramètres actifs
const RAILWAY_API_URL = "https://can-2025-api-production.up.railway.app/predict";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const CAPACITY = {
  'Rabat': 50000,
  'Tanger': 65000,
  'Agadir': 45000,
  'Casablanca': 70000,
  'Marrakech': 40000
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // États pour l'ajout d'image
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedStade, setSelectedStade] = useState('Rabat');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/affluence?select=*&order=timestamp.desc&limit=100`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
        setLastUpdate(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur Supabase:', error);
      setLoading(false);
    }
  };

  // FONCTION CORRIGÉE POUR L'ANALYSE RAILWAY
  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert("Veuillez sélectionner une image d'abord.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('stade', selectedStade);

    try {
      const response = await fetch(RAILWAY_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Analyse Railway réussie ! Les données ont été mises à jour dans Supabase.");
        setSelectedImage(null);
        fetchData(); 
      } else {
        // Correction : Gestion si le serveur renvoie du texte plutôt que du JSON
        const errorText = await response.text();
        let message = "Erreur lors de l'analyse.";
        try {
          const errorData = JSON.parse(errorText);
          message = errorData.message || message;
        } catch (e) {
          message = errorText || message;
        }
        alert(`Erreur Railway: ${message}`);
      }
    } catch (error) {
      console.error("Erreur d'upload:", error);
      alert("Impossible de joindre le serveur Railway. Vérifiez que le domaine est actif.");
    } finally {
      setUploading(false);
    }
  };

  const latestByStade = data.reduce((acc, curr) => {
    if (!acc[curr.stade] || new Date(curr.timestamp) > new Date(acc[curr.stade].timestamp)) {
      acc[curr.stade] = curr;
    }
    return acc;
  }, {});

  const stadeStats = Object.values(latestByStade).map(s => ({
    name: s.stade,
    supporters: s.nombre_supporters,
    capacity: CAPACITY[s.stade] || 50000,
    taux: Math.round((s.nombre_supporters / (CAPACITY[s.stade] || 50000)) * 100)
  }));

  const timeSeriesData = data.slice(0, 30).reverse().map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    [d.stade]: d.nombre_supporters
  }));

  const totalSupporters = stadeStats.reduce((sum, s) => sum + s.supporters, 0);
  const avgOccupancy = stadeStats.length > 0 ? Math.round(stadeStats.reduce((sum, s) => sum + s.taux, 0) / stadeStats.length) : 0;
  const criticalStades = stadeStats.filter(s => s.taux > 80).length;

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #166534 0%, #991b1b 50%, #ca8a04 100%)' }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Connexion au système Railway CAN 2025...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #166534 0%, #991b1b 50%, #ca8a04 100%)', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>🏆 CAN 2025 - Surveillance Affluence</h1>
              <p style={{ color: '#bbf7d0' }}>Analyse par IA YOLOv8 (Railway) & Monitoring Temps Réel</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'white', fontSize: '12px', opacity: 0.8 }}>Dernière synchro</div>
              <div style={{ color: '#fde047', fontFamily: 'monospace', fontSize: '18px' }}>{lastUpdate.toLocaleTimeString('fr-FR')}</div>
            </div>
          </div>
        </div>

        {/* SECTION Upload Image YOLOv8 */}
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '2px dashed rgba(255,255,255,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <Camera color="white" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>Nouvelle Analyse Image (Modèle Railway)</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={selectedStade} 
              onChange={(e) => setSelectedStade(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: 'none', background: 'white' }}
            >
              {Object.keys(CAPACITY).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setSelectedImage(e.target.files[0])}
              style={{ color: 'white' }}
            />

            <button 
              onClick={handleImageUpload}
              disabled={uploading || !selectedImage}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', 
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                opacity: (uploading || !selectedImage) ? 0.5 : 1
              }}
            >
              {uploading ? "Analyse en cours..." : <><Upload size={18} /> Lancer YOLOv8</>}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Total Supporters" value={totalSupporters.toLocaleString()} icon={<Users color="#93c5fd" size={32} />} bg="rgba(59,130,246,0.2)" border="rgba(147,197,253,0.3)" />
          <StatCard title="Taux Moyen" value={`${avgOccupancy}%`} icon={<TrendingUp color="#86efac" size={32} />} bg="rgba(34,197,94,0.2)" border="rgba(134,239,172,0.3)" />
          <StatCard title="Saturé (+80%)" value={criticalStades} icon={<AlertTriangle color="#fca5a5" size={32} />} bg="rgba(239,68,68,0.2)" border="rgba(252,165,165,0.3)" />
          <StatCard title="Stades Actifs" value={stadeStats.length} icon={<Activity color="#d8b4fe" size={32} />} bg="rgba(168,85,247,0.2)" border="rgba(216,180,254,0.3)" />
        </div>

        {/* Graphiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>📊 Occupation des Stades</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stadeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white' }} />
                <Bar dataKey="supporters" fill="#4ade80" name="Supporters" />
                <Bar dataKey="capacity" fill="rgba(255,255,255,0.2)" name="Capacité Max" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>📈 Évolution (Derniers relevés)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                <Legend />
                {Object.keys(latestByStade).map((stade, i) => (
                  <Line key={stade} type="monotone" dataKey={stade} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau Détaillé */}
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>📋 Vue Détaillée</h2>
            <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', opacity: 0.7 }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Stade</th>
                  <th style={{ textAlign: 'right', padding: '12px' }}>Supporters / Capacité</th>
                  <th style={{ textAlign: 'right', padding: '12px' }}>Taux</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stadeStats.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ textAlign: 'right', padding: '12px' }}>{s.supporters.toLocaleString()} / {s.capacity.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '12px', color: s.taux > 80 ? '#fca5a5' : '#86efac' }}>{s.taux}%</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>{s.taux > 80 ? '🔴 Critique' : '🟢 Normal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          <p>CAN 2025 Intelligence System | Railway API + YOLOv8 + Supabase</p>
        </div>
      </div>
    </div>
  );
}

// Composant StatCard réutilisable
const StatCard = ({ title, value, icon, bg, border }) => (
  <div style={{ background: bg, backdropFilter: 'blur(12px)', borderRadius: '8px', padding: '20px', border: `1px solid ${border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ color: 'white', opacity: 0.7, fontSize: '14px', margin: 0 }}>{title}</p>
        <p style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

export default App;
