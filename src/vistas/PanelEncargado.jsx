/*
 * Vista: PANEL DEL ENCARGADO (#/panel y sus subrutas).
 * Une el MENÚ LATERAL (MenuLateral.jsx) con la sección elegida: Panel de control, Reservas
 * (tabla de datos + acciones por fila), Laboratorios (formulario CRUD), Reportes y
 * Configuración. Es una demo sin inicio de sesión, y así lo dice el propio menú.
 * Sin servidor (modo de respaldo) el panel se puede consultar, pero las escrituras del CRUD
 * y de la configuración se deshabilitan con un aviso que explica por qué.
 */
import MenuLateral from '../components/MenuLateral.jsx';
import PanelConfiguracion from './PanelConfiguracion.jsx';
import PanelControl from './PanelControl.jsx';
import PanelLaboratorios from './PanelLaboratorios.jsx';
import PanelReportes from './PanelReportes.jsx';
import PanelReservas from './PanelReservas.jsx';

export default function PanelEncargado({ seccion, ...props }) {
  let contenido;
  if (seccion === 'reservas') contenido = <PanelReservas {...props} />;
  else if (seccion === 'laboratorios') contenido = <PanelLaboratorios {...props} />;
  else if (seccion === 'reportes') contenido = <PanelReportes {...props} />;
  else if (seccion === 'configuracion') contenido = <PanelConfiguracion {...props} />;
  else contenido = <PanelControl {...props} />;

  return (
    <div className="panel">
      <MenuLateral actual={seccion} />
      <div className="panel-contenido">{contenido}</div>
    </div>
  );
}
