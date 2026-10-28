import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateProductDto } from 'src/products/api/dto/product.dto';
import { UpdateCategoryDto } from 'src/categories/api/dto/category.dto';

const errorsOf = (cls: any, body: object) => validateSync(plainToInstance(cls, body)).map((e) => e.property);

describe('DTOs de PATCH con null explícito', () => {
  it('rechaza null en columnas NOT NULL de producto', () => {
    expect(errorsOf(UpdateProductDto, { is_available: null, sort_order: null, category_id: null })).toEqual(
      expect.arrayContaining(['is_available', 'sort_order', 'category_id']),
    );
  });

  it('permite null en description', () => {
    expect(errorsOf(UpdateProductDto, { description: null })).toEqual([]);
  });

  it('rechaza null en sort_order de categoría y acepta un entero', () => {
    expect(errorsOf(UpdateCategoryDto, { sort_order: null })).toEqual(['sort_order']);
    expect(errorsOf(UpdateCategoryDto, { sort_order: 2 })).toEqual([]);
  });
});
