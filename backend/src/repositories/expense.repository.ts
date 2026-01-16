import { BaseRepository } from './base.repository.js';
import { IExpense, IExpenseCreate, IExpenseUpdate, IExpenseSummary, IExpenseByCategory } from '../types/expense.js';

export class ExpenseRepository extends BaseRepository<IExpense> {
  protected tableName = 'expenses';

  async findById(id: string, userId: string): Promise<IExpense | null> {
    const sql = `
      SELECT
        e.*,
        p.name as project_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = $1 AND e.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<IExpense[]> {
    let sql = `
      SELECT
        e.*,
        p.name as project_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.category) {
      sql += ` AND e.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.isDeductible !== undefined) {
      sql += ` AND e.is_deductible = $${paramCount}`;
      params.push(filters.isDeductible);
      paramCount++;
    }

    if (filters.projectId) {
      sql += ` AND e.project_id = $${paramCount}`;
      params.push(filters.projectId);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (e.description ILIKE $${paramCount} OR e.vendor ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND e.expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND e.expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    if (filters.minAmount) {
      sql += ` AND e.amount >= $${paramCount}`;
      params.push(filters.minAmount);
      paramCount++;
    }

    if (filters.maxAmount) {
      sql += ` AND e.amount <= $${paramCount}`;
      params.push(filters.maxAmount);
      paramCount++;
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async create(userId: string, expenseData: IExpenseCreate): Promise<IExpense> {
    const {
      projectId, category, subcategory, description, amount,
      vatAmount = 0, vatPercentage = 21.00, isDeductible = true,
      deductiblePercentage = 100.00, expenseDate, paymentMethod,
      vendor, receiptUrl, notes
    } = expenseData;

    const sql = `
      INSERT INTO expenses (
        user_id, project_id, category, subcategory, description, amount,
        vat_amount, vat_percentage, is_deductible, deductible_percentage,
        expense_date, payment_method, vendor, receipt_url, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, projectId, category, subcategory, description, amount,
      vatAmount, vatPercentage, isDeductible, deductiblePercentage,
      expenseDate, paymentMethod, vendor, receiptUrl, notes
    ]);

    const row = result.rows[0];

    // Log activity
    await this.executeQuery(
      `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'expense_added', 'expense', row.id, `Gasto ${category} añadido: ${amount}€`]
    );

    return this.mapToCamel(row);
  }

  async update(id: string, userId: string, updates: IExpenseUpdate): Promise<IExpense | null> {
    const allowedFields: Record<string, string> = {
      projectId: 'project_id',
      category: 'category',
      subcategory: 'subcategory',
      description: 'description',
      amount: 'amount',
      vatAmount: 'vat_amount',
      vatPercentage: 'vat_percentage',
      isDeductible: 'is_deductible',
      deductiblePercentage: 'deductible_percentage',
      expenseDate: 'expense_date',
      paymentMethod: 'payment_method',
      vendor: 'vendor',
      receiptUrl: 'receipt_url',
      notes: 'notes'
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowedFields[key];
      if (column) {
        fields.push(`${column} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id, userId);
    const sql = `
      UPDATE expenses
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = 'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }

  async getStatistics(userId: string, filters: any = {}): Promise<IExpenseSummary> {
    let sql = `
      SELECT
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(CASE WHEN is_deductible THEN amount * (deductible_percentage / 100) ELSE 0 END), 0) as deductible_amount,
        COALESCE(AVG(amount), 0) as average_expense
      FROM expenses
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    const result = await this.executeQuery(sql, params);
    const row = result.rows[0];
    const mapped = this.mapToCamel(row);
    
    return {
      totalExpenses: parseInt(mapped.totalExpenses || 0),
      totalAmount: parseFloat(mapped.totalAmount || 0),
      totalVat: parseFloat(mapped.totalVat || 0),
      deductibleAmount: parseFloat(mapped.deductibleAmount || 0),
      averageExpense: parseFloat(mapped.averageExpense || 0)
    };
  }

  async getByCategory(userId: string, filters: any = {}): Promise<IExpenseByCategory[]> {
    let sql = `
      SELECT
        category,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM expenses
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ' GROUP BY category ORDER BY total_amount DESC';

    const result = await this.executeQuery(sql, params);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        category: mapped.category,
        expenseCount: parseInt(mapped.expenseCount || 0),
        totalAmount: parseFloat(mapped.totalAmount || 0),
        averageAmount: parseFloat(mapped.averageAmount || 0)
      };
    });
  }

  async getMonthlyExpenses(userId: string, months: number = 12): Promise<any[]> {
    const sql = `
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM') as month,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = $1
        AND expense_date >= CURRENT_DATE - INTERVAL '1 month' * $2
      GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await this.executeQuery(sql, [userId, months]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        month: mapped.month,
        expenseCount: parseInt(mapped.expenseCount || 0),
        totalAmount: parseFloat(mapped.totalAmount || 0)
      };
    });
  }

  async getTopVendors(userId: string, limit: number = 10): Promise<any[]> {
    const sql = `
      SELECT
        vendor,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = $1 AND vendor IS NOT NULL AND vendor != ''
      GROUP BY vendor
      ORDER BY total_amount DESC
      LIMIT $2
    `;

    const result = await this.executeQuery(sql, [userId, limit]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        vendor: mapped.vendor,
        expenseCount: parseInt(mapped.expenseCount || 0),
        totalAmount: parseFloat(mapped.totalAmount || 0)
      };
    });
  }
}

export const expenseRepository = new ExpenseRepository();
