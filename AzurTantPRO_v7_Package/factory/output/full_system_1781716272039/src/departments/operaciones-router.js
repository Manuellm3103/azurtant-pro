// ═══ MULTI-LLM ROUTER: Operaciones y Logística ═══
import { MultiLLMRouter } from '../multiLLMRouter.js';

const operacionesRouter = new MultiLLMRouter({
  deptId: 'operaciones',
  defaultModel: 'minimax-m3:cloud',
  projectName: 'Test Co',
});

// Health check al iniciar
(async () => {
  const health = await operacionesRouter.healthCheck();
  const active = Object.values(health).filter(h => h.healthy).length;
  console.log('[operaciones] MultiLLMRouter: ' + active + '/' + Object.keys(health).length + ' modelos activos');
})();

export { operacionesRouter };
export default operacionesRouter;
