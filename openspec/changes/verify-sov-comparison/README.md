# Verify SOV Comparison Change Proposal

## Summary

This change enhances the Share of Voice (SOV) calculation in the dashboard to provide more accurate brand comparison by incorporating both post volume and engagement metrics.

## Quick Links

- **Proposal**: [proposal.md](./proposal.md) - Why and what changes
- **Tasks**: [tasks.md](./tasks.md) - Implementation checklist (28 tasks)
- **Design**: [design.md](./design.md) - Technical decisions and SOV formulas
- **Spec**: [specs/dashboard-sov-comparison/spec.md](./specs/dashboard-sov-comparison/spec.md) - Requirements and scenarios

## Key Features

1. **Multi-Metric SOV Calculation**
   - Volume-based SOV (posts count)
   - Engagement-based SOV (likes + comments + shares)
   - Weighted SOV (40% volume + 60% engagement)

2. **Interactive UI Toggle**
   - Switch between SOV calculation modes
   - Real-time chart updates
   - Enhanced tooltips with breakdowns

3. **Robust Edge Case Handling**
   - Zero posts scenarios
   - Missing engagement data
   - Single brand projects
   - Negative values sanitization

## Current Status

- [x] Proposal created
- [x] Design documented
- [x] Spec written
- [x] Tasks defined
- [x] Validation passed
- [ ] **Awaiting approval to implement**

## Validation

```bash
openspec validate verify-sov-comparison --strict
# ✅ Change 'verify-sov-comparison' is valid
```

## Next Steps

1. **Review** this proposal with stakeholders
2. **Approve** if design meets requirements
3. **Implement** following tasks.md checklist
4. **Test** with real project data
5. **Deploy** and gather user feedback

## Implementation Estimates

- **Verification & Analysis**: ~2 hours
- **Design Formulas**: ~1 hour
- **Data Layer Implementation**: ~4 hours
- **UI Layer Implementation**: ~3 hours
- **Testing & Validation**: ~2 hours
- **Documentation**: ~1 hour

**Total**: ~13 hours

## Questions or Feedback

If you have questions or suggestions about this proposal, please:
1. Review the [design.md](./design.md) for technical details
2. Check [Open Questions](./design.md#open-questions) section
3. Add comments to this proposal for discussion
