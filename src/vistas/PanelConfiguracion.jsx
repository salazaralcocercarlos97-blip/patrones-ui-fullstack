/*
 * Vista del patrón FORMULARIO DE CONFIGURACIÓN (#/panel/configuracion).
 * Muestra el formulario con la configuración vigente y lo deshabilita con un aviso si no hay
 * servidor (modo de respaldo). Ver ConfiguracionForm.jsx.
 */
import { useState } from 'react';
import { AvisoSoloLectura } from '../components/AvisoConexion.jsx';
import ConfiguracionForm from '../components/ConfiguracionForm.jsx';
import Skeleton from '../components/Skeleton.jsx';

export default function PanelConfiguracion({ refTitulo, cargando, configuracion, soloLectura, onGuardarConfiguracion }) {
  const [guardando, setGuardando] = useState(false);

  const guardar = async (valores) => {
    setGuardando(true);
    const resultado = await onGuardarConfiguracion(valores);
    setGuardando(false);
    return resultado;
  };

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Configuración
          </h1>
          <p className="titulo-sub">Horario de atención y límites de las reservas.</p>
        </div>
      </div>

      {soloLectura && !cargando && <AvisoSoloLectura />}

      {cargando ? (
        <Skeleton variante="lineas" cantidad={4} texto="Cargando la configuración…" />
      ) : (
        <ConfiguracionForm
          configuracion={configuracion}
          soloLectura={soloLectura}
          guardando={guardando}
          onGuardar={guardar}
        />
      )}
    </>
  );
}
