import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // A importação que funcionou para ti
import { Box, Button, Typography, Switch, FormControlLabel } from '@mui/material';

const COURT_WIDTH = 800; // Representa 20m (comprimento)
const COURT_HEIGHT = 400; // Representa 10m (largura)
const SCALE = COURT_WIDTH / 20; // 40 pixels por metro

// Função para criar linhas estáticas do campo
const createLine = (coords, color = 'white', strokeWidth = 2) => {
  return new fabric.Line(coords, {
    stroke: color,
    strokeWidth: strokeWidth,
    selectable: false, // Linhas do campo não são selecionáveis
    evented: false,    // Linhas do campo não disparam eventos
    originX: 'center',
    originY: 'center'
  });
};

const TacticalBoard = () => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Efeito para inicializar o canvas e os event listeners de teclado
  useEffect(() => {
    const canvasElement = canvasRef.current;
    const fCanvas = new fabric.Canvas(canvasElement, {
      width: COURT_WIDTH,
      height: COURT_HEIGHT,
      backgroundColor: '#005A8C', // Verde padel
      selection: true, // Permite seleção de objetos por defeito (quando não em modo desenho)
    });

    // Desenhar Linhas do Campo
    const boundary = new fabric.Rect({
        left: 0, top: 0, width: COURT_WIDTH - 2, height: COURT_HEIGHT - 2,
        fill: 'transparent', stroke: 'white', strokeWidth: 3,
        selectable: false, evented: false,
    });
    fCanvas.add(boundary);

    const net = createLine([COURT_WIDTH / 2, 0, COURT_WIDTH / 2, COURT_HEIGHT], 'white', 3);
    fCanvas.add(net);

    const serviceLineDistanceFromNet = 6.95 * SCALE;
    const serviceLineLeftX = COURT_WIDTH / 2 - serviceLineDistanceFromNet;
    const serviceLineRightX = COURT_WIDTH / 2 + serviceLineDistanceFromNet;
    const serviceLineLeft = createLine([serviceLineLeftX, 0, serviceLineLeftX, COURT_HEIGHT]);
    const serviceLineRight = createLine([serviceLineRightX, 0, serviceLineRightX, COURT_HEIGHT]);
    fCanvas.add(serviceLineLeft, serviceLineRight);

    const centralServiceLineLeft = createLine([serviceLineLeftX, COURT_HEIGHT / 2, COURT_WIDTH / 2, COURT_HEIGHT / 2]);
    const centralServiceLineRight = createLine([COURT_WIDTH / 2, COURT_HEIGHT / 2, serviceLineRightX, COURT_HEIGHT / 2]);
    fCanvas.add(centralServiceLineLeft, centralServiceLineRight);
    // Fim do Desenho das Linhas do Campo

    setFabricCanvas(fCanvas);

    // Handler para apagar objetos com o teclado
    const handleKeyDown = (event) => {
      if (!fCanvas || fCanvas.isDrawingMode) return; // Não apaga se estiver em modo desenho

      const activeObject = fCanvas.getActiveObject();
      if (activeObject) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault(); // Previne comportamento padrão (ex: backspace voltar página)
          if (activeObject.type === 'activeSelection' && activeObject._objects) { // Se for uma multi-seleção
            activeObject._objects.forEach(obj => fCanvas.remove(obj));
          } else { // Se for um único objeto
            fCanvas.remove(activeObject);
          }
          fCanvas.discardActiveObject();
          fCanvas.renderAll();
        }
      }
    };

    // Adiciona event listener para o teclado
    // Usamos o canvas como alvo, mas precisamos garantir que ele possa ter foco
    // Ou podemos adicionar à window, mas com cuidado para não interferir noutros inputs
    canvasElement.addEventListener('keydown', handleKeyDown);


    // Limpeza ao desmontar o componente
    return () => {
      canvasElement.removeEventListener('keydown', handleKeyDown);
      if (fCanvas) {
        fCanvas.dispose();
      }
    };
  }, []); // Corre apenas uma vez ao montar

  // EFEITO PARA ATUALIZAR O MODO DE DESENHO NO CANVAS FABRIC
  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = isDrawingMode; // Define o modo de desenho

      if (isDrawingMode) {
        // Garante que freeDrawingBrush existe e está inicializado
        if (!fabricCanvas.freeDrawingBrush) {
          console.log("freeDrawingBrush não existe, criando um novo PencilBrush...");
          // Cria uma nova instância do PencilBrush e atribui ao canvas
          // A importação 'import * as fabric from 'fabric';' deve tornar fabric.PencilBrush disponível
          try {
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
          } catch (brushError) {
            console.error("Erro ao criar PencilBrush:", brushError);
            // Se PencilBrush não estiver no namespace fabric, pode precisar de importação granular
            // Ex: import { PencilBrush } from 'fabric'; e depois new PencilBrush(fabricCanvas);
            // Mas vamos assumir que está em 'fabric.' por agora.
            return; // Sai se não conseguir criar o pincel
          }
        }

        // Agora que garantimos que existe (ou tentámos criar), podemos configurar
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = 'yellow'; // Cor do desenho
            fabricCanvas.freeDrawingBrush.width = 3;       // Espessura do desenho
        } else {
            console.error("Mesmo após tentativa de criação, freeDrawingBrush continua indefinido.");
        }

        // Quando em modo de desenho, desabilita a seleção de outros objetos para não interferir
        fabricCanvas.selection = false;
        fabricCanvas.getObjects().forEach(obj => {
            if (obj.type !== 'path') { 
                obj.selectable = false;
                obj.evented = false;
            }
        });
      } else {
        // Ao sair do modo de desenho, reabilita a seleção dos objetos
        fabricCanvas.selection = true;
        fabricCanvas.getObjects().forEach(obj => {
            obj.selectable = true;
            obj.evented = true;
        });
      }
      fabricCanvas.renderAll();
    }
  }, [isDrawingMode, fabricCanvas]);


  const addPlayer = (label = 'P1', color = 'blue', x = 50, y = 50) => {
    if (!fabricCanvas) return;
    const playerCircle = new fabric.Circle({
      radius: 15, fill: color,
      originX: 'center', originY: 'center',
    });
    const playerText = new fabric.Text(label, {
      fontSize: 12, fill: 'white',
      originX: 'center', originY: 'center',
      selectable: false, evented: false, // Texto não interativo por si só
    });
    const playerGroup = new fabric.Group([playerCircle, playerText], {
      left: x, top: y,
      selectable: !isDrawingMode, // Só selecionável se não estiver em modo desenho
      evented: !isDrawingMode,
      hasControls: false,
      borderColor: 'lightblue', // Cor da borda quando selecionado
      cornerColor: 'blue',
      cornerSize: 6,
      transparentCorners: false,
    });
    fabricCanvas.add(playerGroup);
    fabricCanvas.renderAll();
  };

  const addBall = (x = COURT_WIDTH / 2, y = COURT_HEIGHT / 2 + 60) => {
    if (!fabricCanvas) return;
    const ball = new fabric.Circle({
      radius: 8, fill: '#FFFF00', stroke: '#E5E400', strokeWidth: 1,
      left: x, top: y, originX: 'center', originY: 'center',
      selectable: !isDrawingMode, // Só selecionável se não estiver em modo desenho
      evented: !isDrawingMode,
      hasControls: false,
      borderColor: 'lightyellow',
      cornerColor: 'yellow',
      cornerSize: 5,
      transparentCorners: false,
    });
    fabricCanvas.add(ball);
    fabricCanvas.renderAll();
  };

  const clearDrawings = () => {
    if (!fabricCanvas) return;
    const objectsToRemove = fabricCanvas.getObjects().filter(obj => obj.type === 'path');
    objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
  };

  return (
    <Box>
      {/* Adicionado tabIndex para que o canvas possa receber foco para eventos de teclado */}
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} tabIndex={0} />
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <Button variant="outlined" onClick={() => addPlayer('P1', 'dodgerblue', 180, COURT_HEIGHT / 4)}>Adicionar P1</Button>
        <Button variant="outlined" onClick={() => addPlayer('P2', 'tomato', 180, COURT_HEIGHT * 3 / 4)}>Adicionar P2</Button>
        <Button variant="outlined" onClick={() => addPlayer('A1', 'mediumseagreen', COURT_WIDTH - 180, COURT_HEIGHT / 4)}>Adicionar A1</Button>
        <Button variant="outlined" onClick={() => addPlayer('A2', 'orange', COURT_WIDTH - 180, COURT_HEIGHT * 3 / 4)}>Adicionar A2</Button>
        <Button variant="contained" onClick={() => addBall()} sx={{backgroundColor: '#FFFF00', color: 'black', '&:hover': {backgroundColor: '#E5E400'}}}>Adicionar Bola</Button>
        
        <FormControlLabel
          control={
            <Switch
              checked={isDrawingMode}
              onChange={(e) => setIsDrawingMode(e.target.checked)}
              color="primary"
            />
          }
          label="Modo Desenho"
          sx={{ml: 1}}
        />
        <Button variant="outlined" color="secondary" onClick={clearDrawings} disabled={isDrawingMode}>
          Limpar Desenhos
        </Button>
      </Box>
      <Box sx={{mt:1}}>
        <Typography variant="caption">Selecione um objeto (jogador/bola/desenho) e pressione 'Delete' ou 'Backspace' para apagar. Ative o "Modo Desenho" para desenhar linhas.</Typography>
      </Box>
    </Box>
  );
};

export default TacticalBoard;