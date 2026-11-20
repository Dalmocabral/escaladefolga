import ExcelJS from 'exceljs';
import type { ShiftConfig } from '../types';
import type { StaffingRowData, StaffingTotals } from './staffing';

interface ExportDailyStaffingOptions {
  shift: ShiftConfig;
  targetDate: Date;
  rows: StaffingRowData[];
  totals: StaffingTotals;
}

export async function exportDailyStaffingToExcel({
  shift,
  targetDate,
  rows,
  totals,
}: ExportDailyStaffingOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Escala Portuária';
  workbook.created = new Date();

  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const year = targetDate.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const sheetName = `Efetivo_${day}_${month}`;
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Estilos de bordas finas padronizadas
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const borderMedium: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } },
  };

  // Cores de fundo fiéis à planilha da imagem do usuário
  const fillDarkHeader: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF36454F' }, // Cinza escuro / Carvão
  };

  const fillSubHeader: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }, // Cinza claro
  };

  const fillPink: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFADBD8' }, // Rosa/Salmão suave para Folga e Férias
  };

  const fillCyan: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00E5FF' }, // Ciano brilhante para DISP. e À DISP.
  };

  const fillWhite: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  };

  // Definindo Largura das Colunas (A até J)
  sheet.columns = [
    { width: 28 }, // A: CATEGORIA
    { width: 15 }, // B: PREVISTO / HC
    { width: 13 }, // C: ATESTADOS
    { width: 12 }, // D: FOLGA
    { width: 12 }, // E: FÉRIAS
    { width: 15 }, // F: TREINAMENTO
    { width: 12 }, // G: DISP.
    { width: 14 }, // H: SOLICITADO
    { width: 12 }, // I: ANTEC.
    { width: 12 }, // J: À DISP.
  ];

  // LINHA 1: Título "PESSOAS" (Merged A1:J1)
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'PESSOAS';
  titleCell.fill = fillDarkHeader;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 26;

  // LINHA 2: Subcabeçalho: Turno | CONTROLE DE PESSOAS | Data
  const row2 = sheet.getRow(2);
  row2.height = 24;

  const turnoCell = sheet.getCell('A2');
  turnoCell.value = shift.title.toUpperCase();
  turnoCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } }; // Vermelho escuro
  turnoCell.fill = fillWhite;
  turnoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  turnoCell.border = borderThin;

  sheet.mergeCells('B2:H2');
  const ctrlCell = sheet.getCell('B2');
  ctrlCell.value = 'CONTROLE DE PESSOAS';
  ctrlCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
  ctrlCell.fill = fillSubHeader;
  ctrlCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 2; c <= 8; c++) {
    sheet.getRow(2).getCell(c).border = borderThin;
  }

  sheet.mergeCells('I2:J2');
  const dateCell = sheet.getCell('I2');
  dateCell.value = dateFormatted;
  dateCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
  dateCell.fill = fillSubHeader;
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('I2').border = borderThin;
  sheet.getCell('J2').border = borderThin;

  // LINHA 3: Cabeçalhos das Colunas
  const headers = [
    { title: 'CATEGORIA', fill: fillSubHeader },
    { title: 'PREVISTO / HC', fill: fillSubHeader },
    { title: 'ATESTADOS', fill: fillSubHeader },
    { title: 'FOLGA', fill: fillPink },
    { title: 'FÉRIAS', fill: fillPink },
    { title: 'TREINAMENTO', fill: fillSubHeader },
    { title: 'DISP.', fill: fillCyan },
    { title: 'SOLICITADO', fill: fillSubHeader },
    { title: 'ANTEC.', fill: fillSubHeader },
    { title: 'À DISP.', fill: fillCyan },
  ];

  const row3 = sheet.getRow(3);
  row3.height = 22;
  headers.forEach((h, idx) => {
    const cell = row3.getCell(idx + 1);
    cell.value = h.title;
    cell.fill = h.fill;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = borderThin;
  });

  // LINHAS DE DADOS (Categorias)
  let currentRowIdx = 4;
  rows.forEach((row) => {
    const r = sheet.getRow(currentRowIdx);
    r.height = 20;

    const values = [
      row.label,
      row.headcount,
      row.atestados,
      row.folga,
      row.ferias,
      row.treinamento,
      row.disponivel,
      row.solicitado,
      row.antec,
      row.aDisposicao,
    ];

    values.forEach((val, idx) => {
      const cell = r.getCell(idx + 1);
      cell.value = val;
      cell.border = borderThin;
      cell.font = { name: 'Calibri', size: 10, bold: idx === 0, color: { argb: 'FF000000' } };

      if (idx === 0) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cell.fill = fillWhite;
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (idx === 3 || idx === 4) {
          cell.fill = fillPink; // Folga e Férias
        } else if (idx === 6 || idx === 9) {
          cell.fill = fillCyan; // DISP e À DISP
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        } else {
          cell.fill = fillWhite;
        }
      }
    });

    currentRowIdx++;
  });

  // LINHA DE TOTAL GERAL
  const totalRow = sheet.getRow(currentRowIdx);
  totalRow.height = 22;
  const totalValues = [
    'TOTAL GERAL',
    totals.headcount,
    totals.atestados,
    totals.folga,
    totals.ferias,
    totals.treinamento,
    totals.disponivel,
    totals.solicitado,
    totals.antec,
    totals.aDisposicao,
  ];

  totalValues.forEach((val, idx) => {
    const cell = totalRow.getCell(idx + 1);
    cell.value = val;
    cell.border = borderMedium;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };

    if (idx === 0) {
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.fill = fillSubHeader;
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (idx === 3 || idx === 4) {
        cell.fill = fillPink;
      } else if (idx === 6 || idx === 9) {
        cell.fill = fillCyan;
      } else {
        cell.fill = fillSubHeader;
      }
    }
  });

  // Gera o buffer e dispara o download no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeShiftTitle = shift.title.replace(/\s+/g, '_');
  link.download = `Controle_Pessoas_${safeShiftTitle}_${day}_${month}_${year}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
