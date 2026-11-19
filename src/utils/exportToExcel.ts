import ExcelJS from 'exceljs';
import type { Employee, EmployeeLeave, ShiftConfig } from '../types';
import type { TeamConfig } from './teams';

export interface DayColumnData {
  dayNumber: number;
  dateKey: string;
  fullDate: string;
  dayShort: string;
  dd: string;
  isSunday: boolean;
  isSaturday: boolean;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Cores das equipes fiéis à planilha Excel do usuário (imagem)
const TEAM_EXCEL_COLORS: Record<number, { fillArgb: string; fontArgb: string }> = {
  0: { fillArgb: 'FF70AD47', fontArgb: 'FF000000' }, // Verde
  1: { fillArgb: 'FF5B9BD5', fontArgb: 'FF000000' }, // Azul
  2: { fillArgb: 'FFFFC000', fontArgb: 'FF000000' }, // Amarela
  3: { fillArgb: 'FFE06666', fontArgb: 'FF000000' }, // Vermelha
  4: { fillArgb: 'FFA6A6A6', fontArgb: 'FF000000' }, // Cinza
  5: { fillArgb: 'FF9966CC', fontArgb: 'FF000000' }, // Roxo
  6: { fillArgb: 'FF4DD0E1', fontArgb: 'FF000000' }, // Ciano
  7: { fillArgb: 'FFFF8A65', fontArgb: 'FF000000' }, // Laranja
};

export async function exportScheduleToExcel(params: {
  roleName: string;
  shift: ShiftConfig;
  month: number; // 0-indexed
  year: number;
  dateColumns: DayColumnData[];
  distributedTeams: { team: TeamConfig; members: Employee[] }[];
  schedule: Record<string, Record<number, boolean>>;
  leaves: EmployeeLeave[];
  scaleType: string;
}) {
  const {
    roleName,
    month,
    year,
    dateColumns,
    distributedTeams,
    schedule,
    leaves,
  } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Escala Portuária';
  workbook.created = new Date();

  const sheetName = `${MONTH_NAMES[month].substring(0, 3)}_${year}`;
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [
      {
        state: 'frozen',
        xSplit: 2, // Congela Matrícula e Nome
        ySplit: 1, // Congela a Linha 1 de Cabeçalho de Datas
        showGridLines: true,
      },
    ],
  });

  const borderAll: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const mm = String(month + 1).padStart(2, '0');
  const yy = String(year).slice(-2);

  // ----------------------------------------------------
  // LINHA 1: Cabeçalho Simples (Matricula | Nome | 01/11/26 dom. | 02/11/26 seg. ...)
  // ----------------------------------------------------
  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;

  // Coluna 1: Matricula
  const matHeader = headerRow.getCell(1);
  matHeader.value = 'Matricula';
  matHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  matHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  matHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  matHeader.border = borderAll;

  // Coluna 2: Nome
  const nomeHeader = headerRow.getCell(2);
  nomeHeader.value = 'Nome';
  nomeHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  nomeHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  nomeHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  nomeHeader.border = borderAll;

  // Colunas de Datas: 01/11/26 dom.
  dateColumns.forEach((col, idx) => {
    const colIndex = 3 + idx;
    const dayHeaderCell = headerRow.getCell(colIndex);
    const dayShortLower = col.dayShort.toLowerCase();
    dayHeaderCell.value = `${col.dd}/${mm}/${yy} ${dayShortLower}.`;
    dayHeaderCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } };
    dayHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    dayHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dayHeaderCell.border = borderAll;
  });

  // Largura das colunas
  worksheet.getColumn(1).width = 12; // Matricula
  worksheet.getColumn(2).width = 32; // Nome
  for (let c = 3; c <= 2 + dateColumns.length; c++) {
    worksheet.getColumn(c).width = 13.5; // Dias com formato completo "01/11/26 dom."
  }

  // ----------------------------------------------------
  // LINHAS DOS COLABORADORES
  // ----------------------------------------------------
  let currentRowIdx = 2;

  distributedTeams.forEach(({ team, members }) => {
    const teamColor = TEAM_EXCEL_COLORS[team.id] || TEAM_EXCEL_COLORS[0];

    members.forEach((emp) => {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 20;

      const empOffs = schedule[emp.id] || {};
      const empActiveLeave = leaves.find((l) => l.employeeId === emp.id);

      // Coluna 1: Matricula (com a cor da equipe)
      const matCell = row.getCell(1);
      matCell.value = emp.registration || '';
      matCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF000000' } };
      matCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: teamColor.fillArgb },
      };
      matCell.alignment = { vertical: 'middle', horizontal: 'center' };
      matCell.border = borderAll;

      // Coluna 2: Nome (fundo branco, borda fina)
      const nameCell = row.getCell(2);
      nameCell.value = emp.name;
      nameCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF000000' } };
      nameCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      nameCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      nameCell.border = borderAll;

      // Colunas dos Dias (C em diante)
      dateColumns.forEach((col, idx) => {
        const dayCell = row.getCell(3 + idx);
        dayCell.border = borderAll;
        dayCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const isLeave =
          empActiveLeave &&
          col.fullDate >= empActiveLeave.startDate &&
          col.fullDate <= empActiveLeave.endDate;

        if (isLeave) {
          let leaveLabel = 'Férias';
          let fgColor = 'FFE1D5E7'; // Lilás / Purple
          if (empActiveLeave.type === 'ATESTADO') {
            leaveLabel = 'Atestado';
            fgColor = 'FFF8CECC'; // Rose / Vermelho claro
          } else if (empActiveLeave.type === 'INSS') {
            leaveLabel = 'INSS';
            fgColor = 'FFFFE599'; // Amarelo/Laranja claro
          } else if (empActiveLeave.type === 'EXAME') {
            leaveLabel = 'Exame';
            fgColor = 'FFB2EBF2'; // Ciano/Teal claro
          }

          dayCell.value = leaveLabel;
          dayCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fgColor },
          };
          dayCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } };
        } else {
          const isOff = empOffs[col.dayNumber] === true;

          // Se for Folga: preenche com a cor da equipe e escreve "Folga"
          // Se for Trabalho: preenche com a cor da equipe sem texto
          dayCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: teamColor.fillArgb },
          };

          if (isOff) {
            dayCell.value = 'Folga';
            dayCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } };
          } else {
            dayCell.value = '';
          }
        }
      });

      currentRowIdx++;
    });
  });

  // Baixar Arquivo .xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeRoleName = roleName.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Escala_${safeRoleName}_${MONTH_NAMES[month]}_${year}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
