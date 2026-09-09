import { describe,expect,it } from 'vitest';
import { categoriesInput,decisionInput,serviceInput } from '../src/vendors/vendor.schemas';
describe('Module 4 onboarding validation',()=>{
 it('prevents duplicate primary and secondary category',()=>expect(()=>categoriesInput.parse({primaryCategoryId:'10000000-0000-4000-8000-000000000001',secondaryCategoryIds:['10000000-0000-4000-8000-000000000001']})).toThrow());
 it('requires a price for fixed pricing',()=>expect(()=>serviceInput.parse({categoryId:'10000000-0000-4000-8000-000000000001',name:'Coverage',pricingType:'FIXED'})).toThrow());
 it('requires rejection feedback',()=>expect(()=>decisionInput.parse({decision:'REJECTED'})).toThrow());
});
